import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { Booking, BookingStatus, PaymentStatus } from '../db/schema';
import { notificationService } from '../services/notificationService';

const router = Router();

// Generar código único de reserva (ej: TOUR-2026-8491)
function generateBookingCode(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TOUR-2026-${random}`;
}

// Obtener todas las reservas
router.get('/', (req: Request, res: Response) => {
  try {
    let bookings = db.getBookings();
    const { status, date, operatorId, search } = req.query;

    if (status && status !== 'all') {
      bookings = bookings.filter(b => b.status === status);
    }
    if (date) {
      bookings = bookings.filter(b => b.date === date);
    }
    if (operatorId) {
      bookings = bookings.filter(b => b.assignedOperatorId === operatorId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      bookings = bookings.filter(b => 
        b.code.toLowerCase().includes(q) ||
        b.leadCustomer.fullName.toLowerCase().includes(q) ||
        b.leadCustomer.email.toLowerCase().includes(q) ||
        b.tourTitle.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener reserva por ID o Código
router.get('/:id', (req: Request, res: Response) => {
  try {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }
    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nueva reserva (Checkout)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      tourId,
      date,
      timeSlot,
      adultsCount,
      childrenCount,
      leadCustomer,
      passengers,
      selectedAddOns = [],
      paymentMethod = 'credit_card',
      paymentDetails = {},
      customOperatorId,
      couponCode,
      language = 'es',
    } = req.body;

    const tour = db.getTourById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour seleccionado no existe' });
    }

    const adults = Number(adultsCount) || 1;
    const children = Number(childrenCount) || 0;
    const totalPassengers = adults + children;

    // Calcular subtotal inicial
    const tourBaseAmount = (adults * tour.price) + (children * tour.childPrice);
    const addOnsAmount = selectedAddOns.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
    const subtotalRaw = tourBaseAmount + addOnsAmount;

    // Aplicar descuento de cupón si existe
    let discountAmount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const c = db.getCouponByCode(couponCode);
      if (c && subtotalRaw >= c.minSpend) {
        validatedCoupon = c;
        if (c.discountType === 'percentage') {
          discountAmount = (subtotalRaw * c.discountValue) / 100;
        } else {
          discountAmount = Math.min(c.discountValue, subtotalRaw);
        }
        db.updateCoupon(c.id, { usedCount: c.usedCount + 1 });
      }
    }

    const subtotal = Math.max(0, subtotalRaw - discountAmount);
    const settings = db.getSettings();
    const tax = subtotal * settings.taxRate;
    const totalAmount = subtotal + tax;

    // Asignar operario/guía por defecto o seleccionado
    const operators = db.getOperators().filter(o => o.active);
    let assignedOperator = operators.find(o => o.id === customOperatorId);
    if (!assignedOperator && operators.length > 0) {
      assignedOperator = operators[0]; // Asigna al primer guía disponible
    }

    const code = generateBookingCode();
    const isTourRequiringApproval = !!tour.requiresOperatorApproval;
    const requestedPaymentStatus = req.body.paymentStatus as PaymentStatus | undefined;
    
    // Si el tour requiere aprobación de guía, SIEMPRE queda en estado pending con cobro pendiente
    const isActuallyPaid = !isTourRequiringApproval && requestedPaymentStatus !== 'pending' && (paymentMethod === 'credit_card' || paymentMethod === 'mercadopago' || paymentMethod === 'paypal');

    const newBooking: Booking = {
      id: `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.images[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      date,
      timeSlot,
      adultsCount: adults,
      childrenCount: children,
      totalPassengers,
      leadCustomer: {
        fullName: leadCustomer.fullName || 'Cliente Principal',
        email: leadCustomer.email,
        phone: leadCustomer.phone,
        country: leadCustomer.country || 'No especificado',
        notes: leadCustomer.notes || '',
      },
      passengers: passengers && passengers.length > 0 ? passengers : [
        {
          fullName: leadCustomer.fullName,
          documentType: 'DNI',
          documentNumber: '12345678',
          ageType: 'adult',
        }
      ],
      selectedAddOns,
      subtotal,
      discountAmount,
      couponCode: validatedCoupon ? validatedCoupon.code : undefined,
      tax,
      totalAmount,
      currency: settings.currency,
      status: isActuallyPaid ? 'confirmed' : 'pending',
      paymentMethod,
      paymentStatus: isActuallyPaid ? 'completed' : 'pending',
      language,
      paymentDetails: {
        transactionId: paymentDetails.transactionId || (isActuallyPaid ? `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}` : undefined),
        cardLast4: paymentDetails.cardLast4 || (paymentMethod === 'credit_card' ? '4242' : undefined),
        cardBrand: paymentDetails.cardBrand || (paymentMethod === 'credit_card' ? 'Visa' : undefined),
        transferReceiptUrl: paymentDetails.transferReceiptUrl,
        paidAt: isActuallyPaid ? new Date().toISOString() : undefined,
      },
      assignedOperatorId: assignedOperator?.id,
      assignedOperatorName: assignedOperator?.name,
      operatorConfirmed: false,
      invoiceNumber: isActuallyPaid ? `FACT-2026-${code.replace('TOUR-2026-', '')}` : undefined,
      invoiceIssuedAt: isActuallyPaid ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`TOUR_BOARDING_PASS:${code}`)}`,
    };

    const savedBooking = db.createBooking(newBooking);

    // Responder de inmediato al usuario para que el modal avance al paso de confirmación y QR sin demoras
    res.status(201).json({
      success: true,
      message: 'Reserva creada y confirmada exitosamente',
      data: savedBooking,
    });

    // Disparar notificaciones multicanal (Email, WhatsApp, In-App) en segundo plano sin congelar la interfaz
    notificationService.dispatchBookingNotifications(savedBooking, tour, assignedOperator).catch(err => {
      console.error('[NotificationService] Error enviando notificaciones en segundo plano:', err);
    });
  } catch (err: any) {
    console.error('Error creando reserva:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar estado de la reserva (ej. pagar, cancelar, confirmar)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;
    const current = db.getBookingById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const prevStatus = current.status;
    const updatePayload: Partial<Booking> = {};
    if (status) updatePayload.status = status as BookingStatus;
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus as PaymentStatus;

    if (paymentStatus === 'completed') {
      const isFirstTimePaid = !current.paymentDetails?.paidAt;
      updatePayload.status = 'paid';
      updatePayload.paymentStatus = 'completed';
      updatePayload.paymentDetails = {
        ...current.paymentDetails,
        paidAt: current.paymentDetails?.paidAt || new Date().toISOString(),
        cardLast4: req.body.cardLast4 || current.paymentDetails?.cardLast4 || '4242',
        cardBrand: req.body.cardBrand || current.paymentDetails?.cardBrand || 'Visa',
      };
      if (!current.invoiceNumber) {
        updatePayload.invoiceNumber = `FACT-2026-${current.code.replace('TOUR-2026-', '')}`;
        updatePayload.invoiceIssuedAt = new Date().toISOString();
      }

      const updated = db.updateBooking(req.params.id, updatePayload);
      
      // Responder de inmediato
      res.json({ success: true, message: 'Pago completado y notificaciones enviadas', data: updated });

      if (updated && isFirstTimePaid) {
        const tour = db.getTourById(updated.tourId);
        if (tour) {
          const operator = updated.assignedOperatorId ? db.getOperatorById(updated.assignedOperatorId) : undefined;
          
          // 1. Notificaciones al cliente (Email con CC a plataforma + WhatsApp) en background
          notificationService.dispatchBookingNotifications(updated, tour, operator).catch(err => {
            console.error('[Bookings] Error enviando notificaciones post-pago:', err);
          });

          // 2. WhatsApp específico al Operario confirmando que el grupo pagó el 100%
          if (operator) {
            import('../services/whatsappQrService').then(({ whatsappQrService }) => {
              const isReady = typeof whatsappQrService.isActive === 'function' 
                ? whatsappQrService.isActive() 
                : whatsappQrService.getStatus().connected;

              if (isReady) {
                whatsappQrService.sendMessage(
                  operator.phone,
                  `🎉 *¡GRUPO 100% PAGADO Y CONFIRMADO!* 🚨\n\nHola *${operator.name}*, el cliente *${updated.leadCustomer.fullName}* ha completado el pago de la reserva *${updated.code}* (${tour.title}).\n\n🧾 *Factura Oficial:* ${updated.invoiceNumber}\n👥 *Total Pasajeros:* ${updated.totalPassengers}\n📲 El grupo ya cuenta con su código QR de abordaje. Todo listo para la salida.`
                ).catch((e: any) => console.error('[Bookings] Error WhatsApp operario:', e));
              }
            }).catch(qrErr => {
              console.error('[Bookings] Error cargando whatsappQrService:', qrErr);
            });
          }
        }
      }
      return;
    }

    const updated = db.updateBooking(req.params.id, updatePayload);
    if (updated) {
      await notificationService.notifyStatusChanged(updated, prevStatus);
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Asignar o reasignar operario/guía a una reserva
router.post('/:id/assign-operator', async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.body;
    const current = db.getBookingById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const operator = db.getOperatorById(operatorId);
    if (!operator) {
      return res.status(404).json({ success: false, error: 'Operario no encontrado' });
    }

    const updated = db.updateBooking(req.params.id, {
      assignedOperatorId: operator.id,
      assignedOperatorName: operator.name,
    });

    const tour = db.getTourById(current.tourId);
    if (tour && updated) {
      // Re-enviar hoja de ruta al nuevo operario asignado
      await notificationService.dispatchBookingNotifications(updated, tour, operator);
    }

    res.json({ success: true, data: updated, message: `Guía ${operator.name} asignado correctamente` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Confirmación de recepción/aceptación por parte del guía u operario
router.post('/:id/confirm-operator', async (req: Request, res: Response) => {
  try {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const updated = db.updateBooking(booking.id, {
      operatorConfirmed: true,
      operatorConfirmedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    });

    if (updated) {
      const tour = db.getTourById(updated.tourId);
      const operator = updated.assignedOperatorId ? db.getOperatorById(updated.assignedOperatorId) : undefined;
      
      if (tour && operator) {
        await notificationService.notifyOperatorAccepted(updated, operator, tour);
      } else {
        await notificationService.notifyStatusChanged(updated, `Confirmado por Guía (${updated.assignedOperatorName || 'Operario'})`);
      }
    }

    res.json({
      success: true,
      message: `¡Asignación confirmada con éxito! El dueño ha recibido la notificación.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Escaneo y validación de código QR (Check-in en el punto de encuentro)
router.post('/validate-qr', async (req: Request, res: Response) => {
  try {
    const { rawQrData } = req.body;
    if (!rawQrData) {
      return res.status(400).json({ success: false, error: 'Datos de QR vacíos' });
    }

    // Extraer código de reserva
    let code = rawQrData;
    if (rawQrData.includes('TOUR_BOARDING_PASS:')) {
      const parts = rawQrData.split(':');
      code = parts[1];
    }

    const booking = db.getBookingById(code.trim());
    if (!booking) {
      return res.status(404).json({ success: false, error: `No se encontró ninguna reserva con el código "${code}"` });
    }

    if (booking.status === 'boarded') {
      return res.json({
        success: true,
        alreadyBoarded: true,
        message: `Esta reserva ya fue abordada previamente el ${booking.checkInAt || 'día de hoy'}.`,
        data: booking,
      });
    }

    const updated = db.updateBooking(booking.id, {
      status: 'boarded',
      checkInAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    });

    if (updated) {
      await notificationService.notifyStatusChanged(updated, booking.status);
    }

    res.json({
      success: true,
      message: `¡Pase validado con éxito! Bienvenido(s) ${booking.leadCustomer.fullName} y sus acompañantes (${booking.totalPassengers} personas).`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar todas las reservas y notificaciones para empezar pruebas desde cero
router.delete('/clear-all', (req: Request, res: Response) => {
  try {
    db.clearBookings();
    res.json({ success: true, message: 'Todas las reservas y notificaciones han sido eliminadas correctamente.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
