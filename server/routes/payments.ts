import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { boldService } from '../services/boldService';
import { notificationService } from '../services/notificationService';

const router = Router();

/**
 * GET /api/payments/bold/config
 * Retorna configuración pública para la inicialización del SDK / Botón de Bold en el cliente
 */
router.get('/bold/config', (req: Request, res: Response) => {
  try {
    const exchangeRate = boldService.getExchangeRate();
    const isSandbox = boldService.isSandbox();
    res.json({
      success: true,
      data: {
        currency: 'COP',
        exchangeRate,
        isSandbox,
        hasCustomCredentials: !!(process.env.BOLD_IDENTITY_KEY && process.env.BOLD_SECRET_KEY),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/bold/create-session
 * Prepara la orden de cobro y firma SHA-256 de Bold para una reserva
 */
router.post('/bold/create-session', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId es obligatorio' });
    }

    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const originUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const checkoutConfig = boldService.createCheckoutConfig(booking, originUrl);

    res.json({
      success: true,
      data: checkoutConfig,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/bold/webhook
 * Receptor de notificaciones de pago en tiempo real enviadas por Bold
 */
router.post('/bold/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-bold-signature'] as string | undefined;
    const payload = req.body;

    console.log('[Bold Webhook] 🔔 Evento recibido:', JSON.stringify(payload));

    const isValid = boldService.verifyWebhook(payload, signature);
    if (!isValid) {
      console.warn('[Bold Webhook] ⚠️ Firma de webhook no válida');
      return res.status(401).json({ success: false, error: 'Firma inválida' });
    }

    // Bold suele enviar orderId / order_id y status ('approved' | 'APPROVED' | 'rejected' | 'failed')
    const orderId = payload.orderId || payload.order_id || payload.data?.order_id || payload.reference;
    const status = (payload.status || payload.payment_status || payload.data?.status || '').toUpperCase();
    const transactionId = payload.transactionId || payload.transaction_id || payload.id || `BOLD-${Date.now()}`;
    const paymentType = payload.paymentMethod || payload.payment_method || 'BOLD_CHECKOUT';

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId no especificado en el webhook' });
    }

    const current = db.getBookingById(orderId);
    if (!current) {
      console.warn(`[Bold Webhook] Reserva con ID ${orderId} no encontrada`);
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    if (status === 'APPROVED' || status === 'COMPLETED' || status === 'PAID') {
      const updatePayload: any = {
        status: 'paid',
        paymentStatus: 'completed',
        paymentMethod: 'bold',
        paymentDetails: {
          ...current.paymentDetails,
          transactionId,
          cardBrand: paymentType,
          paidAt: new Date().toISOString(),
        },
      };

      if (!current.invoiceNumber) {
        updatePayload.invoiceNumber = `FACT-2026-${current.code.replace('TOUR-2026-', '')}`;
        updatePayload.invoiceIssuedAt = new Date().toISOString();
      }

      const updated = db.updateBooking(current.id, updatePayload);
      console.log(`[Bold Webhook] ✅ Reserva ${current.code} confirmada y pagada exitosamente`);

      if (updated) {
        const tour = db.getTourById(updated.tourId);
        if (tour) {
          const operator = updated.assignedOperatorId ? db.getOperatorById(updated.assignedOperatorId) : undefined;
          notificationService.dispatchBookingNotifications(updated, tour, operator).catch(err => {
            console.error('[Bold Webhook] Error despachando notificaciones:', err);
          });
        }
      }

      return res.json({ success: true, message: 'Pago procesado correctamente' });
    } else {
      console.log(`[Bold Webhook] ℹ️ Estado de transacción Bold: ${status}`);
      if (status === 'REJECTED' || status === 'FAILED') {
        db.updateBooking(current.id, { paymentStatus: 'rejected' });
      }
      return res.json({ success: true, message: `Estado registrado: ${status}` });
    }
  } catch (err: any) {
    console.error('[Bold Webhook] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/bold/simulate-success
 * Permite confirmar exitosamente una reserva con Bold en modo prueba o sandbox
 */
router.post('/bold/simulate-success', async (req: Request, res: Response) => {
  try {
    const { bookingId, transactionId = `BOLD-TEST-${Date.now().toString(36).toUpperCase()}` } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId requerido' });
    }

    const current = db.getBookingById(bookingId);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const updatePayload: any = {
      status: 'paid',
      paymentStatus: 'completed',
      paymentMethod: 'bold',
      paymentDetails: {
        ...current.paymentDetails,
        transactionId,
        cardBrand: 'Bold Colombia (PSE/Nequi/Tarjeta)',
        cardLast4: '8888',
        paidAt: new Date().toISOString(),
      },
    };

    if (!current.invoiceNumber) {
      updatePayload.invoiceNumber = `FACT-2026-${current.code.replace('TOUR-2026-', '')}`;
      updatePayload.invoiceIssuedAt = new Date().toISOString();
    }

    const updated = db.updateBooking(current.id, updatePayload);

    if (updated) {
      const tour = db.getTourById(updated.tourId);
      if (tour) {
        const operator = updated.assignedOperatorId ? db.getOperatorById(updated.assignedOperatorId) : undefined;
        notificationService.dispatchBookingNotifications(updated, tour, operator).catch(err => {
          console.error('[Bold Simulate] Error despachando notificaciones:', err);
        });
      }
    }

    res.json({
      success: true,
      message: 'Pago de prueba procesado y confirmado con Bold',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
