import nodemailer from 'nodemailer';
import { Server as SocketIOServer } from 'socket.io';
import { Booking, Tour, Operator, SystemSettings, NotificationItem } from '../db/schema';
import { db } from '../db/store';
import { 
  getCustomerConfirmationEmailHtml, 
  getOwnerAlertEmailHtml, 
  getOperatorDispatchEmailHtml,
  getCustomerPreReservationEmailHtml,
  getCustomerOperatorAcceptedEmailHtml
} from './emailTemplates';
import { whatsappService } from './whatsappService';
import { whatsappQrService } from './whatsappQrService';

export class NotificationService {
  private io: SocketIOServer | null = null;
  private etherealTransporter: nodemailer.Transporter | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  private async getMailTransporter(settings: SystemSettings): Promise<{ transporter: nodemailer.Transporter; isSimulated: boolean }> {
    if (!settings.smtpConfig.isSimulated && settings.smtpConfig.user && !settings.smtpConfig.user.includes('terraaventura.com')) {
      // Usar SMTP real configurado por el usuario
      const transporter = nodemailer.createTransport({
        host: settings.smtpConfig.host,
        port: settings.smtpConfig.port,
        secure: settings.smtpConfig.port === 465,
        auth: {
          user: settings.smtpConfig.user,
          pass: settings.smtpConfig.pass,
        },
      });
      return { transporter, isSimulated: false };
    }

    // Cuenta de prueba automatizada en Ethereal para previsualizar correos reales en el navegador
    if (!this.etherealTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      this.etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    return { transporter: this.etherealTransporter, isSimulated: true };
  }

  /**
   * Envía correo con fallback inteligente:
   * 1. Usa Resend HTTPS REST API si hay API key (ultrarrápido, 100ms, no bloquea puertos)
   * 2. Usa Nodemailer SMTP si no hay Resend API key
   */
  public async sendEmail(opts: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    cc?: string;
    settings: SystemSettings;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const resendKey = process.env.RESEND_API_KEY || (opts.settings.smtpConfig?.pass?.startsWith('re_') ? opts.settings.smtpConfig.pass : null);

    if (resendKey) {
      try {
        const rawFrom = opts.from || opts.settings.smtpConfig?.from || 'TerraAventura Tours <reservas@test.rodeotest.shop>';
        const fromEmail = rawFrom.includes('<') ? rawFrom : `"TerraAventura Tours" <${rawFrom}>`;

        // Si el destinatario es de prueba (ej: andrea@ejemplo.com, test@tours.com), redirigir a euryhealer@gmail.com
        let targetTo = opts.to;
        if (targetTo.includes('ejemplo.com') || targetTo.includes('test.com') || targetTo.includes('tours.com') || targetTo.includes('@test')) {
          targetTo = opts.settings.platformAuditEmail || opts.settings.businessEmail || 'euryhealer@gmail.com';
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [targetTo],
            ...(opts.cc && opts.cc !== targetTo ? { cc: [opts.cc] } : {}),
            subject: opts.subject,
            html: opts.html,
          }),
        });

        const data: any = await res.json();
        if (res.ok && data.id) {
          console.log(`[Resend-API] ✉️ Correo entregado vía HTTPS a ${targetTo} (ID: ${data.id})`);
          return { success: true, messageId: data.id };
        } else {
          console.warn('[Resend-API] Respuesta de Resend:', data);
        }
      } catch (err: any) {
        console.warn('[Resend-API] Error enviando por HTTPS API:', err.message);
      }
    }

    try {
      const { transporter, isSimulated } = await this.getMailTransporter(opts.settings);
      const info = await transporter.sendMail({
        from: opts.from || opts.settings.smtpConfig.from,
        to: opts.to,
        ...(opts.cc ? { cc: opts.cc } : {}),
        subject: opts.subject,
        html: opts.html,
      });
      const previewUrl = isSimulated ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err: any) {
      console.error('[Email-SMTP] Error enviando correo:', err.message);
      return { success: false };
    }
  }

  /**
   * Dispara el flujo completo de notificaciones (Email, WhatsApp, In-App) para una nueva reserva o actualización
   */
  public async dispatchBookingNotifications(booking: Booking, tour: Tour, operator?: Operator) {
    const settings = db.getSettings();
    const assignedOp = operator || (booking.assignedOperatorId ? db.getOperatorById(booking.assignedOperatorId) : undefined);

    console.log(`[NotificationService] Procesando notificaciones para reserva ${booking.code}...`);

    // 1. IN-APP BROADCAST (Websockets)
    if (this.io) {
      const inAppAlert = {
        type: 'NEW_BOOKING',
        title: '¡Nueva Reserva Registrada!',
        message: `${booking.leadCustomer.fullName} ha reservado ${booking.totalPassengers} cupo(s) para "${tour.title}" (${booking.code})`,
        booking,
        timestamp: new Date().toISOString(),
      };

      this.io.emit('booking:created', booking);
      this.io.emit('notification:in_app', inAppAlert);

      db.addNotification({
        id: `notif-inapp-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.code,
        channel: 'in_app',
        recipientRole: 'owner',
        recipientName: 'Panel de Administración & Operadores',
        recipientContact: 'In-App WebSockets',
        title: inAppAlert.title,
        message: inAppAlert.message,
        status: 'delivered',
        timestamp: inAppAlert.timestamp,
      });
    }

    // 2. EMAIL AL CLIENTE (CON COPIA CC A LA PLATAFORMA)
    if (settings.notificationChannels.emailCustomer && booking.leadCustomer.email) {
      try {
        const auditCcEmail = settings.platformAuditEmail || settings.businessEmail;
        const isPaid = booking.paymentStatus === 'completed';

        const emailHtml = isPaid
          ? getCustomerConfirmationEmailHtml(booking, tour, assignedOp, settings)
          : getCustomerPreReservationEmailHtml(booking, tour, settings);

        const subject = isPaid
          ? `🎟️ Tu Reserva y Factura están Confirmadas: ${tour.title} (Código: ${booking.code})`
          : `📋 Solicitud de Reserva Recibida: ${tour.title} (Código: ${booking.code})`;

        let toAddress = booking.leadCustomer.email;
        if (toAddress.includes('ejemplo.com') || toAddress.includes('test.com') || toAddress.includes('@test')) {
          toAddress = auditCcEmail || 'eury87@gmail.com';
        }

        const ccAddress = (auditCcEmail && auditCcEmail !== toAddress)
          ? auditCcEmail
          : undefined;

        const emailResult = await this.sendEmail({
          to: toAddress,
          cc: ccAddress,
          subject,
          html: emailHtml,
          settings,
        });

        db.addNotification({
          id: `notif-email-cust-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.code,
          channel: 'email',
          recipientRole: 'customer',
          recipientName: booking.leadCustomer.fullName,
          recipientContact: `${booking.leadCustomer.email} (CC: ${auditCcEmail})`,
          title: isPaid ? `Factura y Reserva Confirmada #${booking.code}` : `Solicitud Recibida #${booking.code}`,
          message: `Correo enviado al cliente con copia de auditoría a ${auditCcEmail}.`,
          status: emailResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString(),
          emailPreviewUrl: emailResult.previewUrl,
        });
      } catch (err: any) {
        console.error('[Email] Error enviando correo a cliente:', err);
      }
    }

    // 3. EMAIL AL PROPIETARIO / ADMINISTRACIÓN
    if (settings.notificationChannels.emailOwner && settings.businessEmail) {
      try {
        const ownerEmailHtml = getOwnerAlertEmailHtml(booking, tour, assignedOp, settings);

        const emailResult = await this.sendEmail({
          to: settings.businessEmail,
          subject: `💰 Nueva Reserva: ${booking.code} - ${booking.leadCustomer.fullName} (${settings.currencySymbol}${booking.totalAmount.toFixed(2)})`,
          html: ownerEmailHtml,
          settings,
        });

        db.addNotification({
          id: `notif-email-owner-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.code,
          channel: 'email',
          recipientRole: 'owner',
          recipientName: 'Administración',
          recipientContact: settings.businessEmail,
          title: `Alerta de Venta #${booking.code}`,
          message: `Ingreso de reserva por ${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency}`,
          status: emailResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString(),
          emailPreviewUrl: emailResult.previewUrl,
        });
      } catch (err: any) {
        console.error('[Email] Error enviando correo a dueño:', err);
      }
    }

    // 4. EMAIL AL OPERARIO / GUÍA ASIGNADO
    if (settings.notificationChannels.emailOperator && assignedOp && assignedOp.email) {
      try {
        const opEmailHtml = getOperatorDispatchEmailHtml(booking, tour, assignedOp, settings);

        const emailResult = await this.sendEmail({
          to: assignedOp.email,
          subject: `📋 Nueva Hoja de Ruta Asignada: ${tour.title} - ${booking.date} (${booking.code})`,
          html: opEmailHtml,
          settings,
        });

        db.addNotification({
          id: `notif-email-op-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.code,
          channel: 'email',
          recipientRole: 'operator',
          recipientName: assignedOp.name,
          recipientContact: assignedOp.email,
          title: `Orden de Operación #${booking.code}`,
          message: `Lista de pasajeros y datos de ruta enviados al guía.`,
          status: emailResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString(),
          emailPreviewUrl: emailResult.previewUrl,
        });
      } catch (err: any) {
        console.error('[Email] Error enviando correo a operario:', err);
      }
    }

    // 5. NOTIFICACIONES DE WHATSAPP (Generación de enlaces y envío directo)
    if (settings.notificationChannels.whatsappCustomer && booking.leadCustomer.phone) {
      const isPaid = booking.paymentStatus === 'completed';
      const cleanPhone = booking.leadCustomer.phone.replace(/[^0-9]/g, '');
      const qrStatus = whatsappQrService.getStatus();

      let text = '';
      if (isPaid) {
        text = whatsappService.generateCustomerMessage(booking, tour, assignedOp, settings).text;
      } else {
        text =
`📋 *¡SOLICITUD DE RESERVA RECIBIDA (0% COBRADO)!* - ${settings.businessName.toUpperCase()}

Hola *${booking.leadCustomer.fullName}*, hemos recibido tu solicitud de reserva para *${tour.title}* (${booking.code}) para el ${booking.date} a las ${booking.timeSlot}.

⏳ *Estado: En espera de confirmación de tu guía oficial (${assignedOp ? assignedOp.name : 'Asignado'}).*
🛡️ *No se ha realizado ningún cobro.*

En cuanto tu guía confirme disponibilidad, te enviaremos por este mismo medio el enlace para procesar tu pago seguro y emitir tu Factura Comercial Oficial y Pase Digital QR.`;
      }
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

      console.log(`[NotificationService] Despachando WhatsApp al cliente (${cleanPhone})...`);
      await whatsappService.sendViaApi(cleanPhone, text, settings.whatsappConfig);

      // Si el teléfono ingresado fue un teléfono ficticio (como 555) y hay un WhatsApp conectado por QR,
      // enviarle una copia a su número para que la prueba sea visible en su celular
      if (cleanPhone.includes('555') && qrStatus.connected && qrStatus.phone) {
        console.log(`[NotificationService] Teléfono ficticio (${cleanPhone}). Enviando copia al WhatsApp vinculado (${qrStatus.phone})...`);
        await whatsappService.sendViaApi(qrStatus.phone, text, settings.whatsappConfig);
      }

      db.addNotification({
        id: `notif-wa-cust-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.code,
        channel: 'whatsapp',
        recipientRole: 'customer',
        recipientName: booking.leadCustomer.fullName,
        recipientContact: booking.leadCustomer.phone,
        title: `WhatsApp de Confirmación #${booking.code}`,
        message: text,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        whatsappLink: url,
      });
    }

    if (settings.notificationChannels.whatsappOperator && assignedOp && assignedOp.phone) {
      const { text, url } = whatsappService.generateOperatorMessage(booking, tour, assignedOp, settings);
      await whatsappService.sendViaApi(assignedOp.phone, text, settings.whatsappConfig);

      db.addNotification({
        id: `notif-wa-op-${Date.now()}`,
        bookingId: booking.id,
        bookingCode: booking.code,
        channel: 'whatsapp',
        recipientRole: 'operator',
        recipientName: assignedOp.name,
        recipientContact: assignedOp.phone,
        title: `WhatsApp al Operario (${assignedOp.name})`,
        message: text,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        whatsappLink: url,
      });
    }

    // Emitir actualización de lista de notificaciones por WebSockets
    if (this.io) {
      this.io.emit('notifications:updated', db.getNotifications());
    }
  }

  /**
   * Notifica al cliente por Email (con CC a plataforma) y WhatsApp cuando el operador acepta la salida
   */
  public async notifyOperatorAccepted(booking: Booking, operator: Operator, tour: Tour) {
    const settings = db.getSettings();
    const auditCcEmail = settings.platformAuditEmail || settings.businessEmail;
    const baseUrl = process.env.PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
    const checkoutUrl = `${baseUrl.replace(/\/$/, '')}/?bookingId=${booking.id}&step=checkout`;

    console.log(`[NotificationService] Guía ${operator.name} aceptó el tour ${booking.code}. Notificando a cliente...`);

    // 1. Email al cliente con CC a la plataforma
    if (settings.notificationChannels.emailCustomer && booking.leadCustomer.email) {
      try {
        const emailHtml = getCustomerOperatorAcceptedEmailHtml(booking, tour, operator, settings, checkoutUrl);

        let toAddress = booking.leadCustomer.email;
        if (toAddress.includes('ejemplo.com') || toAddress.includes('test.com') || toAddress.includes('@test')) {
          toAddress = auditCcEmail || 'eury87@gmail.com';
        }

        const ccAddress = (auditCcEmail && auditCcEmail !== toAddress)
          ? auditCcEmail
          : undefined;

        const emailResult = await this.sendEmail({
          to: toAddress,
          cc: ccAddress,
          subject: `🎉 ¡Tu Guía ha Confirmado la Salida! Procede con el Pago: ${tour.title} (${booking.code})`,
          html: emailHtml,
          settings,
        });

        db.addNotification({
          id: `notif-email-accepted-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.code,
          channel: 'email',
          recipientRole: 'customer',
          recipientName: booking.leadCustomer.fullName,
          recipientContact: `${booking.leadCustomer.email} (CC: ${auditCcEmail})`,
          title: `Guía Confirmó Salida #${booking.code}`,
          message: `Correo enviado al cliente habilitando pago seguro con copia a ${auditCcEmail}.`,
          status: emailResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString(),
          emailPreviewUrl: emailResult.previewUrl,
        });
      } catch (err) {
        console.error('[Email] Error enviando email de aceptación de operador:', err);
      }
    }

    // 2. WhatsApp al cliente
    if (settings.notificationChannels.whatsappCustomer && booking.leadCustomer.phone) {
      const text =
`🎉 *¡TU TOUR HA SIDO APROBADO POR EL GUÍA!* - ${settings.businessName.toUpperCase()}

Hola *${booking.leadCustomer.fullName}*, tu guía oficial *${operator.name}* ha confirmado la disponibilidad de tu salida para *${tour.title}* (${booking.code}) el ${booking.date} a las ${booking.timeSlot}.

💳 *Para procesar tu pago seguro y emitir tu Factura Oficial con Pase QR:*

${checkoutUrl}

🛡️ En cuanto completes el pago, tú y tu guía recibirán la confirmación oficial con Factura y Voucher QR tanto por WhatsApp como por correo electrónico.`;

      await whatsappService.sendViaApi(booking.leadCustomer.phone, text, settings.whatsappConfig);
    }

    // 3. WebSockets Alert
    if (this.io) {
      this.io.emit('booking:updated', booking);
      this.io.emit('notification:in_app', {
        type: 'OPERATOR_ACCEPTED',
        title: `Guía Confirmó Salida: ${booking.code}`,
        message: `${operator.name} confirmó la asignación. El cliente recibió enlace de pago por WhatsApp y Email con copia a ${auditCcEmail}.`,
        booking,
        timestamp: new Date().toISOString(),
      });
      this.io.emit('notifications:updated', db.getNotifications());
    }
  }

  /**
   * Notifica al cliente y a la administración cuando el operador declina la salida
   */
  public async notifyOperatorDeclined(booking: Booking, operator: Operator, tour: Tour) {
    const settings = db.getSettings();
    const auditCcEmail = settings.platformAuditEmail || settings.businessEmail;

    console.log(`[NotificationService] Guía ${operator.name} declinó el tour ${booking.code}. Notificando a cliente...`);

    // 1. Email al cliente con CC a la plataforma
    if (settings.notificationChannels.emailCustomer && booking.leadCustomer.email) {
      try {
        let toAddress = booking.leadCustomer.email;
        if (toAddress.includes('test') || toAddress.includes('ejemplo.com') || toAddress.includes('@test')) {
          toAddress = auditCcEmail || 'euryhealer@gmail.com';
        }

        const ccAddress = (auditCcEmail && auditCcEmail !== toAddress)
          ? auditCcEmail
          : undefined;

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #0f172a; color: #ffffff; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f87171; margin-top: 0;">ℹ️ Actualización de tu Solicitud de Tour</h2>
            <p style="font-size: 15px; line-height: 1.5;">Hola <strong>${booking.leadCustomer.fullName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5;">Te informamos que el guía asignado no cuenta con cupos disponibles para el turno solicitado en <strong>${tour.title}</strong> para el <strong>${booking.date} (${booking.timeSlot})</strong>.</p>
            <div style="background: rgba(255,255,255,0.08); padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f87171;">
              <p style="margin: 4px 0; font-size: 14px;">🛡️ <strong>Sin ningún cobro:</strong> No se ha realizado ningún cargo a tu cuenta.</p>
              <p style="margin: 4px 0; font-size: 14px;">📞 Nuestro equipo de coordinación te contactará de inmediato para proponerte un horario alternativo o reasignarte con otro guía certificado.</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">Código de Solicitud: <strong>${booking.code}</strong></p>
          </div>
        `;

        const emailResult = await this.sendEmail({
          to: toAddress,
          cc: ccAddress,
          subject: `ℹ️ Actualización sobre tu solicitud: ${tour.title} (${booking.code})`,
          html: emailHtml,
          settings,
        });
        db.addNotification({
          id: `notif-email-declined-${Date.now()}`,
          bookingId: booking.id,
          bookingCode: booking.code,
          channel: 'email',
          recipientRole: 'customer',
          recipientName: booking.leadCustomer.fullName,
          recipientContact: `${booking.leadCustomer.email} (CC: ${auditCcEmail})`,
          title: `Guía Declinó Turno #${booking.code}`,
          message: `Notificación enviada al cliente. No se realizó ningún cargo.`,
          status: 'sent',
          timestamp: new Date().toISOString(),
          emailPreviewUrl: previewUrl,
        });

        console.log(`[Email] Correo de Declinación enviado: ${info.messageId}`);
      } catch (err) {
        console.error('[Email] Error enviando email de declinación de operador:', err);
      }
    }

    // 2. WhatsApp al cliente
    if (settings.notificationChannels.whatsappCustomer && booking.leadCustomer.phone) {
      const text = `ℹ️ *ACTUALIZACIÓN DE SOLICITUD - ${settings.businessName.toUpperCase()}*\n\nHola *${booking.leadCustomer.fullName}*, el guía asignado no tiene disponibilidad en el turno seleccionado para *${tour.title}* (${booking.code}).\n\n🛡️ *Tranquilidad:* No se ha realizado ningún cobro.\nNuestro equipo de coordinación te contactará de inmediato para reprogramar con otro guía disponible.`;
      await whatsappService.sendViaApi(booking.leadCustomer.phone, text, settings.whatsappConfig);
    }

    // 3. WebSockets Alert
    if (this.io) {
      this.io.emit('booking:updated', booking);
      this.io.emit('notification:in_app', {
        type: 'OPERATOR_DECLINED',
        title: `Guía Declinó Turno: ${booking.code}`,
        message: `${operator.name} declinó la asignación para la reserva ${booking.code}. El cliente fue notificado sin cobro alguno.`,
        booking,
        timestamp: new Date().toISOString(),
      });
      this.io.emit('notifications:updated', db.getNotifications());
    }
  }

  /**
   * Notifica cuando el estado de una reserva cambia (ej. marcado como "Abordado" con QR)
   */
  public async notifyStatusChanged(booking: Booking, previousStatus: string) {
    if (this.io) {
      this.io.emit('booking:updated', booking);
      this.io.emit('notification:in_app', {
        type: 'STATUS_CHANGED',
        title: `Reserva Actualizada: ${booking.code}`,
        message: `El estado cambió de "${previousStatus.toUpperCase()}" a "${booking.status.toUpperCase()}"`,
        booking,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const notificationService = new NotificationService();
