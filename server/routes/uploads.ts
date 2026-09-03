import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storageService } from '../services/storageService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB límite
  },
});

/**
 * POST /api/uploads
 * Subida Dual: Guarda en disco local y respalda en Cloudinary
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo' });
    }

    const result = await storageService.saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: {
        filename: result.filename,
        localUrl: result.localUrl,
        cloudinaryUrl: result.cloudinaryUrl || null,
        backupSuccess: result.backupSuccess,
        url: result.cloudinaryUrl || result.localUrl, // URL principal preferente
      },
    });
  } catch (err: any) {
    console.error('[Uploads] Error al procesar archivo:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al subir archivo' });
  }
});

export default router;
