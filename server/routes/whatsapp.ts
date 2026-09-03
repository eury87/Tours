import { Router, Request, Response } from 'express';
import { whatsappQrService } from '../services/whatsappQrService';

const router = Router();

// Obtener estado actual de la conexión de WhatsApp
router.get('/status', (req: Request, res: Response) => {
  const status = whatsappQrService.getStatus();
  res.json({ success: true, data: status });
});

// Iniciar sesión y generar código QR
router.post('/start', async (req: Request, res: Response) => {
  try {
    const result = await whatsappQrService.startSession();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Desconectar sesión de WhatsApp
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    await whatsappQrService.disconnect();
    res.json({ success: true, message: 'Sesión desconectada exitosamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Enviar mensaje de prueba
router.post('/test', async (req: Request, res: Response) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Se requiere teléfono y mensaje' });
  }

  try {
    const delivered = await whatsappQrService.sendMessage(phone, message);
    res.json({
      success: delivered,
      message: delivered ? 'Mensaje enviado exitosamente vía WhatsApp Web QR' : 'No se pudo entregar el mensaje. Verifica que el QR esté escaneado.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
