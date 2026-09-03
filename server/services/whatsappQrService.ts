import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  WASocket
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { db } from '../db/store';

class WhatsAppQrService {
  private sock: WASocket | null = null;
  private qrDataUrl: string | null = null;
  private isConnected: boolean = false;
  private connectedPhone: string | null = null;
  private isInitializing: boolean = false;
  private io: SocketIOServer | null = null;
  private authDir: string = path.join(process.cwd(), 'data', 'whatsapp_session');

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      phone: this.connectedPhone,
      qrDataUrl: this.qrDataUrl,
      initializing: this.isInitializing,
    };
  }

  public isActive(): boolean {
    return this.isConnected && !!this.sock;
  }

  public async startSession(): Promise<{ success: boolean; qrDataUrl?: string; message?: string }> {
    if (this.isConnected) {
      return { success: true, message: `Ya conectado como ${this.connectedPhone}` };
    }

    if (this.isInitializing && this.qrDataUrl) {
      return { success: true, qrDataUrl: this.qrDataUrl };
    }

    this.isInitializing = true;
    this.qrDataUrl = null;

    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      console.log(`[WhatsApp-QR] Inicializando Baileys v${version.join('.')}...`);

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['TerraAventura SaaS', 'Chrome', '1.0.0'],
        syncFullHistory: false,
      });

      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('[WhatsApp-QR] Nuevo código QR recibido de WhatsApp.');
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, {
              width: 300,
              margin: 2,
              color: { dark: '#022c22', light: '#ffffff' }
            });

            if (this.io) {
              this.io.emit('whatsapp:qr', { qrDataUrl: this.qrDataUrl });
            }
          } catch (qrErr) {
            console.error('[WhatsApp-QR] Error generando imagen QR:', qrErr);
          }
        }

        if (connection === 'open') {
          console.log('[WhatsApp-QR] ¡Conexión establecida con éxito!');
          this.isConnected = true;
          this.isInitializing = false;
          this.qrDataUrl = null;
          this.connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';

          if (this.io) {
            this.io.emit('whatsapp:connected', { phone: this.connectedPhone });
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsApp-QR] Conexión cerrada. Código: ${statusCode}. ¿Reconectar?: ${shouldReconnect}`);
          this.isConnected = false;
          this.isInitializing = false;

          if (shouldReconnect) {
            setTimeout(() => this.startSession(), 4000);
          } else {
            this.clearSessionFiles();
            if (this.io) {
              this.io.emit('whatsapp:disconnected');
            }
          }
        }
      });

      // Escuchar respuestas de guías ("1" o "CONFIRMO" para aceptar turno)
      sock.ev.on('messages.upsert', async (m) => {
        for (const msg of m.messages) {
          if (!msg || !msg.message) continue;

          const body = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       (msg.message as any).buttonsResponseMessage?.selectedButtonId || 
                       '';
          const trimmed = body.trim().toUpperCase();

          // Un comando de respuesta ("1", "2", "OK") tiene menos de 20 caracteres.
          // Si el mensaje es largo (>25 caracteres), es una plantilla del sistema y se ignora por completo para evitar auto-aceptar.
          if (!body || body.length > 25) continue;
          if (msg.key.fromMe && body.length > 3) continue;

          const fromJid = msg.key.remoteJid || '';
          const participant = msg.key.participant || '';
          const rawPhone = (fromJid.split('@')[0] || participant.split('@')[0] || '').split(':')[0];

          console.log(`[WhatsApp-QR] Respuesta detectada de ${rawPhone} (${fromJid}, fromMe=${msg.key.fromMe}): "${body}"`);

          const isAccept = /^(1|1\.|SI|SÍ|OK|CONFIRMO|ACEPTO)$/i.test(trimmed);
          const isDecline = /^(2|2\.|NO|DECLINO|RECHAZO)$/i.test(trimmed);

          if (isAccept) {
            await this.handleOperatorReply(rawPhone, 'accept');
          } else if (isDecline) {
            await this.handleOperatorReply(rawPhone, 'decline');
          }
        }
      });

      return { success: true, message: 'Inicializando sesión QR' };
    } catch (err: any) {
      this.isInitializing = false;
      console.error('[WhatsApp-QR] Error al iniciar sesión:', err);
      return { success: false, message: err.message };
    }
  }

  public async sendMessage(toPhone: string, messageText: string): Promise<boolean> {
    if (!this.sock || !this.isConnected) {
      console.log(`[WhatsApp-QR] No hay sesión activa de WhatsApp para enviar a ${toPhone}.`);
      return false;
    }

    try {
      const cleanPhone = toPhone.replace(/[^0-9]/g, '');
      const jid = `${cleanPhone}@s.whatsapp.net`;

      await this.sock.sendMessage(jid, { text: messageText });
      console.log(`[WhatsApp-QR] ✅ Mensaje entregado a ${toPhone}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp-QR] Error enviando mensaje a ${toPhone}:`, err);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
    } catch (err) {
      console.error('[WhatsApp-QR] Error during logout:', err);
    } finally {
      this.isConnected = false;
      this.connectedPhone = null;
      this.qrDataUrl = null;
      this.isInitializing = false;
      this.clearSessionFiles();
      if (this.io) {
        this.io.emit('whatsapp:disconnected');
      }
    }
  }

  private clearSessionFiles() {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Error clearing session dir:', e);
    }
  }

  private async handleOperatorReply(phone: string, action: 'accept' | 'decline') {
    const operators = db.getOperators();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    let matchedOperator = operators.find(op => {
      const opPhoneClean = op.phone.replace(/[^0-9]/g, '');
      return opPhoneClean.includes(cleanPhone) || cleanPhone.includes(opPhoneClean);
    });

    // Fallback: si remoteJid vino como ID interno (@lid), buscar el operario con reserva pendiente de confirmación
    if (!matchedOperator) {
      const pending = db.getBookings().find(b => !b.operatorConfirmed && b.assignedOperatorId);
      if (pending && pending.assignedOperatorId) {
        matchedOperator = db.getOperatorById(pending.assignedOperatorId);
      }
    }

    if (matchedOperator) {
      console.log(`[WhatsApp-QR] Mensaje coincide con el guía registrado: ${matchedOperator.name} (${matchedOperator.phone}) - Acción: ${action.toUpperCase()}`);
      const bookings = db.getBookings();
      // Buscar última reserva asignada a este guía pendiente de confirmar
      const pendingBooking = bookings.find(b => b.assignedOperatorId === matchedOperator!.id && !b.operatorConfirmed);

      if (pendingBooking) {
        const tour = db.getTourById(pendingBooking.tourId);
        const { notificationService } = await import('./notificationService');

        if (action === 'accept') {
          db.updateBooking(pendingBooking.id, {
            operatorConfirmed: true,
            status: 'confirmed',
            operatorConfirmedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          });

          const updatedBooking = db.getBookingById(pendingBooking.id);
          if (tour && updatedBooking) {
            // 1. Responder de inmediato por WhatsApp confirmando al operario
            await this.sendMessage(matchedOperator.phone, `✅ *¡TURNO ACEPTADO POR TI!*\n\nHas confirmado el servicio para el tour *${tour.title}* (${pendingBooking.code}). El cliente ha recibido su enlace de pago por WhatsApp y correo.`);

            // 2. Disparar notificaciones al cliente habilitando el pago seguro
            await notificationService.notifyOperatorAccepted(updatedBooking, matchedOperator, tour);
          }

          if (this.io) {
            this.io.emit('booking:updated', db.getBookingById(pendingBooking.id));
            this.io.emit('notification:in_app', {
              type: 'OPERATOR_ACCEPTED_WHATSAPP',
              title: `Guía Aceptó por WhatsApp`,
              message: `${matchedOperator.name} respondió "1 (ACEPTAR)" por WhatsApp para la reserva ${pendingBooking.code}.`,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Declinado por el operario (Opción 2)
          db.updateBooking(pendingBooking.id, {
            operatorConfirmed: false,
            status: 'cancelled',
          });

          const updatedBooking = db.getBookingById(pendingBooking.id);
          if (tour && updatedBooking) {
            // 1. Confirmar al operario que declinó el servicio
            await this.sendMessage(matchedOperator.phone, `❌ *TURNO DECLINADO*\n\nHas declinado el servicio para el tour *${tour.title}* (${pendingBooking.code}). La administración y el cliente fueron notificados (sin realizar cobros).`);

            // 2. Notificar al cliente y plataforma
            await notificationService.notifyOperatorDeclined(updatedBooking, matchedOperator, tour);
          }

          if (this.io) {
            this.io.emit('booking:updated', db.getBookingById(pendingBooking.id));
            this.io.emit('notification:in_app', {
              type: 'OPERATOR_DECLINED_WHATSAPP',
              title: `Guía Declinó por WhatsApp`,
              message: `${matchedOperator.name} respondió "2 (DECLINAR)" por WhatsApp para la reserva ${pendingBooking.code}.`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  }
}

export const whatsappQrService = new WhatsAppQrService();
