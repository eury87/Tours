import { Booking, Tour, Operator, SystemSettings } from '../db/schema';
import { whatsappQrService } from './whatsappQrService';

export interface WhatsAppMessageResult {
  recipient: string;
  phone: string;
  messageText: string;
  directUrl: string;
  status: 'sent' | 'simulated';
  apiResponse?: any;
}

export class WhatsAppService {
  /**
   * Genera el mensaje para el cliente final
   */
  public generateCustomerMessage(booking: Booking, tour: Tour, operator: Operator | undefined, settings: SystemSettings): { text: string; url: string } {
    const cleanPhone = booking.leadCustomer.phone.replace(/[^0-9]/g, '');
    
    const text = 
`🌴 *¡RESERVA CONFIRMADA - ${settings.businessName.toUpperCase()}!* 🌴

Hola *${booking.leadCustomer.fullName}*, tu aventura ha sido confirmada con éxito.

🎟️ *Código de Reserva:* ${booking.code}
🧾 *Factura Electrónica:* ${booking.invoiceNumber || 'FACT-2026-001'}
🗺️ *Tour:* ${tour.title}
📅 *Fecha:* ${booking.date}
⏰ *Hora:* ${booking.timeSlot}
👥 *Pasajeros:* ${booking.totalPassengers} (${booking.adultsCount} Adultos${booking.childrenCount > 0 ? `, ${booking.childrenCount} Niños` : ''})
📍 *Punto de Encuentro:* ${tour.meetingPoint.name}
📌 *Ubicación Maps:* ${tour.meetingPoint.googleMapsUrl}

${operator ? `👤 *Tu Guía Asignado:* ${operator.name} (${operator.phone})\n` : ''}
💰 *Total Facturado:* ${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency} (${booking.paymentStatus === 'completed' ? '✅ Pagado' : '⏳ Pendiente'})

📲 *Tu Pase Digital (QR) y Factura:*
Muestra tu código *${booking.code}* o tu voucher al llegar al punto de encuentro.

¡Nos vemos pronto para vivir esta experiencia única!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    return { text, url };
  }

  /**
   * Genera el mensaje para el operario/guía asignado
   */
  public generateOperatorMessage(booking: Booking, tour: Tour, operator: Operator, settings: SystemSettings): { text: string; url: string } {
    const cleanPhone = operator.phone.replace(/[^0-9]/g, '');

    const approvalNote = tour.requiresOperatorApproval
      ? '⏳ *Modalidad:* Requiere aprobación previa del guía (el cliente esperará tu confirmación para procesar el pago).'
      : '⚡ *Modalidad:* Confirmación y pago directo.';

    const text =
`🚨 *NUEVA ASIGNACIÓN DE TOUR - ${settings.businessName.toUpperCase()}* 🚨

Hola *${operator.name}*, se te ha asignado el siguiente grupo:

🎟️ *Reserva:* ${booking.code}
🗺️ *Tour:* ${tour.title}
📅 *Fecha:* ${booking.date} | ⏰ *Hora:* ${booking.timeSlot}
👥 *Total Pasajeros:* ${booking.totalPassengers}
👤 *Cliente Líder:* ${booking.leadCustomer.fullName}
📞 *Teléfono Cliente:* ${booking.leadCustomer.phone}
📍 *Punto:* ${tour.meetingPoint.name}

${approvalNote}

📝 *Requerimientos Especiales:*
${booking.passengers.map(p => `- ${p.fullName}: ${p.specialRequirements || 'Sin notas'}`).join('\n')}

✍️ *Para ACEPTAR el turno:* Escribe el número *1* y dale a Enviar en este chat.
✍️ *Para DECLINAR el turno:* Escribe el número *2* y dale a Enviar en este chat.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    return { text, url };
  }

  /**
   * Genera el mensaje final para el operario cuando el grupo ya completó el pago del 100%
   */
  public generateOperatorPaidMessage(booking: Booking, tour: Tour, operator: Operator, settings: SystemSettings): { text: string; url: string } {
    const cleanPhone = operator.phone.replace(/[^0-9]/g, '');

    const text =
`🎉 *¡GRUPO 100% PAGADO Y CONFIRMADO!* - ${settings.businessName.toUpperCase()} 🚨

Hola *${operator.name}*, el cliente *${booking.leadCustomer.fullName}* ha completado el pago de la reserva *${booking.code}* (${tour.title}).

🧾 *Factura Oficial:* ${booking.invoiceNumber || `FACT-2026-${booking.code.replace('TOUR-2026-', '')}`}
📅 *Fecha:* ${booking.date} | ⏰ *Hora:* ${booking.timeSlot}
👥 *Total Pasajeros:* ${booking.totalPassengers} (${booking.adultsCount} Adultos${booking.childrenCount > 0 ? `, ${booking.childrenCount} Niños` : ''})
👤 *Cliente Líder:* ${booking.leadCustomer.fullName} (${booking.leadCustomer.phone})
📍 *Punto de Encuentro:* ${tour.meetingPoint.name}
📌 *Ubicación Maps:* ${tour.meetingPoint.googleMapsUrl}

📝 *Lista de Pasajeros:*
${booking.passengers.map(p => `- ${p.fullName} (${p.documentType || 'DOC'}: ${p.documentNumber || 'N/A'})${p.specialRequirements ? ` | ${p.specialRequirements}` : ''}`).join('\n')}

📲 El grupo ya cuenta con su código QR de abordaje emitido. Todo listo para la salida.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    return { text, url };
  }

  /**
   * Genera el mensaje para el dueño / administrador
   */
  public generateOwnerMessage(booking: Booking, tour: Tour, settings: SystemSettings): { text: string; url: string } {
    const cleanPhone = settings.businessPhone.replace(/[^0-9]/g, '');

    const text =
`💰 *NUEVA VENTA REGISTRADA - ${settings.businessName.toUpperCase()}* 💰

🎟️ *Reserva:* ${booking.code}
💵 *Monto:* ${settings.currencySymbol}${booking.totalAmount.toFixed(2)} ${settings.currency}
🗺️ *Tour:* ${tour.title}
📅 *Fecha:* ${booking.date} (${booking.timeSlot})
👥 *Pasajeros:* ${booking.totalPassengers}
👤 *Cliente:* ${booking.leadCustomer.fullName} (${booking.leadCustomer.email})
💳 *Método:* ${booking.paymentMethod.toUpperCase()} (${booking.paymentStatus.toUpperCase()})`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    return { text, url };
  }

  /**
   * Envía el mensaje: Prioriza WhatsApp Web QR si está conectado, o la API de Meta si está configurada
   */
  public async sendViaApi(phone: string, text: string, config: SystemSettings['whatsappConfig']): Promise<WhatsAppMessageResult> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

    // 1. PRIORIDAD: Si hay sesión conectada por Código QR, enviar directamente desde el número vinculado
    const qrStatus = whatsappQrService.getStatus();
    if (qrStatus.connected) {
      console.log(`[WhatsAppService] Enviando mensaje a través de sesión WhatsApp Web QR conectada (${qrStatus.phone})...`);
      const sent = await whatsappQrService.sendMessage(cleanPhone, text);
      return {
        recipient: `WhatsApp Web QR (${qrStatus.phone})`,
        phone: cleanPhone,
        messageText: text,
        directUrl,
        status: sent ? 'sent' : 'simulated',
        apiResponse: { mode: 'whatsapp_web_qr', phone: qrStatus.phone, delivered: sent }
      };
    }

    try {
      // Envío real a WhatsApp Cloud API de Meta
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: text },
        }),
      });

      const data = await response.json();
      return {
        recipient: 'WhatsApp Meta API',
        phone: cleanPhone,
        messageText: text,
        directUrl,
        status: 'sent',
        apiResponse: data,
      };
    } catch (err: any) {
      console.error('Error enviando mensaje WhatsApp Cloud API:', err);
      return {
        recipient: 'WhatsApp Meta API (Error)',
        phone: cleanPhone,
        messageText: text,
        directUrl,
        status: 'simulated',
        apiResponse: { error: err.message },
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
