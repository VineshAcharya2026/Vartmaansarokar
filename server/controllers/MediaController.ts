import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { MediaService } from '../services/MediaService.js';
import { asyncHandler } from '../utils/errorHandler.js';

const mediaService = new MediaService();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const uploadStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOADS_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 15 * 1024 * 1024)
  },
  fileFilter: (req, file, callback) => {
    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]);

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
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
  const media = mediaService.listMedia({
    search: typeof search === 'string' ? search : undefined,
    kind: typeof kind === 'string' && ['image', 'audio', 'pdf', 'other'].includes(kind) ? kind as any : undefined
  });

  res.json({
    success: true,
    message: 'Files loaded.',
    data: { media }
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