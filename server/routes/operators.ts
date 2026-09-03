import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { Operator } from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const operators = db.getOperators();
    res.json({ success: true, data: operators });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, avatar, languages } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Nombre, correo y teléfono son obligatorios' });
    }

    const newOp: Operator = {
      id: `op-${Date.now()}`,
      name,
      email,
      phone,
      role: role || 'Guía Principal',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      languages: Array.isArray(languages) ? languages : ['Español', 'Inglés'],
      active: true,
    };

    const saved = db.addOperator(newOp);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateOperator(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Operario no encontrado' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
