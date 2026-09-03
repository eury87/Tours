import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[Cloudinary] ✅ Conexión configurada para la nube: ${cloudName}`);
} else {
  console.log(`[Cloudinary] ℹ️ Variables CLOUDINARY_* no configuradas. Los archivos se guardarán localmente en ./uploads.`);
}

// Directorio local de subidas
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface StoredFileResult {
  filename: string;
  originalName: string;
  localPath: string;
  localUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  backupSuccess: boolean;
}

export class StorageService {
  /**
   * Guarda un archivo directamente en Cloudinary (100% Cloud-Native, sin ocupar disco local)
   * Si Cloudinary no está configurado (modo dev offline), recurre temporalmente al disco local.
   */
  public async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string = 'image/jpeg'
  ): Promise<StoredFileResult> {
    const ext = path.extname(originalName) || '.jpg';
    const timestamp = Date.now();
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanBase}_${timestamp}${ext}`;

    const result: StoredFileResult = {
      filename,
      originalName,
      localPath: '',
      localUrl: '',
      backupSuccess: false,
    };

    // 1. MODO PRINCIPAL: 100% DIRECTO A CLOUDINARY (Cero disco local)
    if (isCloudinaryConfigured) {
      try {
        const publicId = `tours-uploads/${path.basename(filename, ext)}`;
        
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              folder: 'tours-platform',
              resource_type: 'auto',
              overwrite: true,
            },
            (error, uploaded) => {
              if (error) return reject(error);
              resolve(uploaded);
            }
          );
          uploadStream.end(buffer);
        });

        result.cloudinaryUrl = uploadResult.secure_url;
        result.cloudinaryPublicId = uploadResult.public_id;
        result.localUrl = uploadResult.secure_url; // La URL oficial es la de Cloudinary
        result.backupSuccess = true;
        console.log(`[Storage] ☁️ Archivo subido 100% directo a Cloudinary (sin guardar copia local): ${uploadResult.secure_url}`);
        return result;
      } catch (err: any) {
        console.error(`[Storage] ⚠️ Error subiendo a Cloudinary:`, err.message);
      }
    }

    // 2. MODO FALLBACK OFFLINE (Solo si aún no se configuran las claves de Cloudinary)
    const localPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    result.localPath = localPath;
    result.localUrl = `/uploads/${filename}`;
    console.log(`[Storage] ℹ️ Cloudinary no configurado. Guardado temporalmente en disco local: ${result.localUrl}`);

    return result;
  }

  /**
   * Auto-restauración: Si el archivo no existe en el disco local (p. ej. reinicio de contenedor efímero),
   * busca el respaldo en Cloudinary, lo descarga al disco local y retorna la URL.
   */
  public async restoreOrGetFile(filename: string): Promise<{ localPath: string; streamUrl?: string } | null> {
    const localPath = path.join(UPLOADS_DIR, filename);

    // Si existe localmente, servirlo directo
    if (fs.existsSync(localPath)) {
      return { localPath };
    }

    // Si no existe localmente pero Cloudinary está activo, buscar respaldo
    if (isCloudinaryConfigured) {
      try {
        const ext = path.extname(filename);
        const nameWithoutExt = path.basename(filename, ext);
        const publicId = `tours-platform/tours-uploads/${nameWithoutExt}`;

        // Obtener URL de Cloudinary
        const cloudUrl = cloudinary.url(publicId, { secure: true, resource_type: 'image' });
        
        console.log(`[Dual-Storage] 🔄 Archivo local no encontrado. Restaurando desde Cloudinary: ${cloudUrl}`);
        
        // Descargar de Cloudinary y cachear en disco local para futuras peticiones
        const response = await fetch(cloudUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
          console.log(`[Dual-Storage] ✅ Archivo ${filename} re-sincronizado exitosamente en disco local.`);
          return { localPath, streamUrl: cloudUrl };
        }
      } catch (err: any) {
        console.warn(`[Dual-Storage] No se pudo auto-restaurar ${filename} desde Cloudinary:`, err.message);
      }
    }

    return null;
  }
}

export const storageService = new StorageService();
