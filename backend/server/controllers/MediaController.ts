import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { MediaService } from '../services/MediaService.js';
import { asyncHandler } from '../utils/errorHandler.js';

const mediaService = new MediaService();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.heic', '.heif', '.avif']);

const uploadStorage = multer.diskStorage({
  destination: async (req, file, callback) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    callback(null, UPLOADS_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 15 * 1024 * 1024)
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImage = file.mimetype.startsWith('image/') || ALLOWED_IMAGE_EXTENSIONS.has(ext);
    const isPdf = file.mimetype === 'application/pdf';
    const ALLOWED_AUDIO_MIME_TYPES = new Set([
      'audio/mpeg', 'audio/mp3',
      'audio/wav', 'audio/x-wav',
      'audio/ogg',
      'audio/mp4', 'audio/x-m4a', 'audio/m4a'
    ]);
    const isAllowedAudio = ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype);

    if (!isImage && !isPdf && !isAllowedAudio) {
      callback(new Error('Unsupported file type'));
      return;
    }
    callback(null, true);
  }
});

export const uploadFile = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
        error: 'Missing file'
      });
    }

    const media = await mediaService.createMedia(req.file);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: { media }
    });
  })
];

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const { search, kind } = req.query;
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 100);
  const media = await mediaService.listMedia({
    search: typeof search === 'string' ? search : undefined,
    kind: typeof kind === 'string' && ['image', 'audio', 'pdf', 'other'].includes(kind) ? kind as any : undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 100
  });

  res.json({
    success: true,
    message: 'Files loaded.',
    data: media
  });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await mediaService.deleteMedia(id as string);

  res.json({
    success: true,
    message: 'File deleted.',
    data: { deletedId: deleted.id }
  });
});