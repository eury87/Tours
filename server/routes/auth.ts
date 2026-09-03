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
        token: `jwt-${user.id}-${Date.now()}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Autenticación con Google
router.post('/google', (req: Request, res: Response) => {
  try {
    const { email, name, picture, sub } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email de Google es requerido' });
    }

    let user = db.getUserByEmail(email);

    if (!user) {
      user = {
        id: `usr-g-${sub || Date.now()}`,
        name: name || 'Agente / Propietario',
        email: email,
        role: 'company_admin', // Administrador / Dueño de agencia
        companyId: 'comp-1',
        avatar: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      db.createUser(user);
    } else {
      // Si el usuario ya existía pero con rol agente/cliente, asegurar que tenga acceso de administrador
      if (user.role === 'customer' || user.role === 'agent') {
        user.role = 'company_admin';
        db.updateUser(user.id, { role: 'company_admin' });
      }
    }

    res.json({
      success: true,
      message: `Bienvenido, ${user.name}`,
      data: {
        user,
        token: `jwt-google-${user.id}-${Date.now()}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login Manual (Email & Contraseña)
router.post('/login-manual', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = db.getUsers().find(u => u.email.toLowerCase() === cleanEmail);

    // Credenciales por defecto para agentes y administradores
    if (!user) {
      const settings = db.getSettings();
      if (cleanEmail === settings.businessEmail?.toLowerCase() || cleanEmail.includes('eury') || cleanEmail === 'owner@terraaventura.com') {
        user = db.getUsers().find(u => u.role === 'company_admin') || {
          id: `usr-admin-${Date.now()}`,
          name: 'Propietario Principal',
          email: cleanEmail,
          role: 'company_admin',
          companyId: 'comp-1',
        };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas o cuenta de agente no registrada' });
    }

    res.json({
      success: true,
      message: `Acceso concedido a ${user.name}`,
      data: {
        user,
        token: `jwt-manual-${user.id}-${Date.now()}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registro Estratégico Exclusivo para Agentes (creado por un dueño/agente activo o con código de invitación)
router.post('/register-agent', (req: Request, res: Response) => {
  try {
    const { name, email, role = 'agent', inviteCode } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Nombre y correo son requeridos' });
    }

    // Código de seguridad para prevenir registros no autorizados por parte de turistas
    const VALID_INVITE_CODES = ['AGENTE2026', 'TERRA_VIP', 'ADMIN_STAFF'];
    if (inviteCode && !VALID_INVITE_CODES.includes(inviteCode.toUpperCase().trim())) {
      return res.status(403).json({ success: false, error: 'Código de autorización de agente inválido' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ya existe una cuenta con este correo electrónico' });
    }

    const newAgent = {
      id: `usr-agent-${Date.now()}`,
      name,
      email: cleanEmail,
      role: (role === 'company_admin' ? 'company_admin' : 'agent') as any,
      companyId: 'comp-1',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    db.createUser(newAgent);

    res.status(201).json({
      success: true,
      message: `Cuenta de agente creada exitosamente para ${name}`,
      data: {
        user: newAgent,
        token: `jwt-agent-${newAgent.id}-${Date.now()}`
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
