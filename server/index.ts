import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';

import toursRouter from './routes/tours';
import bookingsRouter from './routes/bookings';
import operatorsRouter from './routes/operators';
import notificationsRouter from './routes/notifications';
import settingsRouter from './routes/settings';
import authRouter from './routes/auth';
import couponsRouter from './routes/coupons';
import whatsappRouter from './routes/whatsapp';
import { notificationService } from './services/notificationService';
import { whatsappQrService } from './services/whatsappQrService';

import uploadsRouter from './routes/uploads';
import { storageService, UPLOADS_DIR } from './services/storageService';

const app = express();
const server = http.createServer(app);

// Configurar WebSockets
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

notificationService.setSocketServer(io);
whatsappQrService.setSocketServer(io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware Dual-Storage: Si el archivo existe en disco se sirve de inmediato.
// Si el contenedor fue reiniciado o el disco se borró, se auto-restaura desde Cloudinary.
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const restored = await storageService.restoreOrGetFile(filename);
    if (restored) {
      return res.sendFile(restored.localPath);
    }
    res.status(404).json({ success: false, error: 'Archivo no encontrado en almacenamiento local ni en respaldo' });
  } catch (err) {
    next();
  }
});
app.use('/uploads', express.static(UPLOADS_DIR));

// Rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/tours', toursRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/operators', operatorsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/uploads', uploadsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'Tours Booking & Notification API' });
});

// Servir frontend compilado en producción (despliegue unificado)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`[Production] 🌐 Frontend estático montado desde: ${clientDistPath}`);
}

// Conexión WebSockets para clientes y administradores
io.on('connection', (socket) => {
  console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor de Tours & Notificaciones corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSocket listo para transmisión en tiempo real`);

  // Restaurar automáticamente sesión de WhatsApp si ya fue vinculada previamente
  whatsappQrService.startSession().catch((err) => {
    console.log('[WhatsApp-QR] Esperando vinculación manual por QR.');
  });
});
