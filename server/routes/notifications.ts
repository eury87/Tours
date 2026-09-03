import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { notificationService } from '../services/notificationService';

const router = Router();

// Listar historial de notificaciones (Email, WhatsApp, In-App)
router.get('/', (req: Request, res: Response) => {
  try {
    const notifications = db.getNotifications();
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reenviar notificaciones de una reserva
router.post('/resend/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = db.getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const tour = db.getTourById(booking.tourId);
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour no encontrado' });
    }

    const operator = booking.assignedOperatorId ? db.getOperatorById(booking.assignedOperatorId) : undefined;
    await notificationService.dispatchBookingNotifications(booking, tour, operator);

    res.json({ success: true, message: `Notificaciones reenviadas para la reserva ${booking.code}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Enviar email de prueba directo con factura y voucher HTML
router.post('/test-email', async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ success: false, error: 'Email requerido' });

  try {
    const settings = db.getSettings();
    const bookings = db.getBookings();
    const tour = db.getTours()[0];
    const booking = bookings[0] || {
      id: 'demo-test',
      code: 'TOUR-2026-DEMO',
      tourTitle: tour ? tour.title : 'Expedición VIP',
      date: '2026-09-15',
      timeSlot: '08:00 AM',
      adultsCount: 2,
      childrenCount: 0,
      totalPassengers: 2,
      totalAmount: 370.00,
      tax: 37.00,
      subtotal: 370.00,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      leadCustomer: {
        fullName: 'Cliente de Prueba',
        email: to,
        phone: '+507 6754 6550',
      },
      invoiceNumber: 'FACT-2026-DEMO',
      invoiceIssuedAt: new Date().toISOString(),
    };

    const { transporter } = await (notificationService as any).getMailTransporter(settings);

    let fromAddress = settings.smtpConfig.from;
    if (settings.smtpConfig.host.includes('resend.com') && fromAddress.includes('terraaventura.com')) {
      fromAddress = '"TerraAventura Tours" <onboarding@resend.dev>';
    }

    const { getCustomerConfirmationEmailHtml } = await import('../services/emailTemplates');
    const html = getCustomerConfirmationEmailHtml(booking as any, tour, undefined, settings);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `🎟️ [PRUEBA RESEND] Factura y Confirmación: ${booking.tourTitle} (Código: ${booking.code})`,
      html,
    });

    console.log(`[Resend Test] Email entregado a ${to}: ${info.messageId}`);
    res.json({
      success: true,
      messageId: info.messageId,
      message: `¡Correo con Factura Oficial enviado exitosamente a ${to}!`,
    });
  } catch (err: any) {
    console.error('Error enviando email de prueba:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
