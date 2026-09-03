import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { Coupon } from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const coupons = db.getCoupons();
    res.json({ success: true, data: coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Código de cupón requerido' });
    }

    const coupon = db.getCouponByCode(code);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Cupón no válido o inactivo' });
    }

    const amount = Number(subtotal) || 0;
    if (amount < coupon.minSpend) {
      return res.status(400).json({
        success: false,
        error: `Este cupón requiere un monto mínimo de compra de $${coupon.minSpend} USD`
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    res.json({
      success: true,
      data: {
        coupon,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalSubtotal: Math.max(0, amount - discountAmount),
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { code, description, discountType, discountValue, minSpend } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ success: false, error: 'Código y valor de descuento son requeridos' });
    }

    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      description: description || 'Descuento promocional',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minSpend: Number(minSpend) || 0,
      usedCount: 0,
      active: true,
    };

    const saved = db.createCoupon(newCoupon);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteCoupon(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
