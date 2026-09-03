import { Router, Request, Response } from 'express';
import { db } from '../db/store';

const router = Router();

router.get('/users', (req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/companies', (req: Request, res: Response) => {
  try {
    const companies = db.getCompanies();
    res.json({ success: true, data: companies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, role, userId } = req.body;

    let user;
    if (userId) {
      user = db.getUserById(userId);
    } else if (email) {
      user = db.getUserByEmail(email);
    } else if (role) {
      user = db.getUsers().find(u => u.role === role);
    }

    if (!user) {
      // Fallback a cliente por defecto
      user = db.getUsers().find(u => u.role === 'customer') || {
        id: `usr-${Date.now()}`,
        name: 'Cliente Invitado',
        email: email || 'cliente@ejemplo.com',
        role: 'customer',
      };
    }

    res.json({
      success: true,
      message: `Sesión iniciada como ${user.name} (${user.role})`,
      data: {
        user,
        token: `mock-jwt-token-${user.id}-${Date.now()}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
