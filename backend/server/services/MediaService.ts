import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { sharedStore as store } from '../store.js';
import { MediaFile } from '../../../vartmaan-shared-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const UPLOADS_DIR_CANDIDATES = Array.from(new Set([
  UPLOADS_DIR,
  path.join(process.cwd(), 'backend', 'uploads'),
  path.join(process.cwd(), 'uploads')
]));
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.heic', '.heif', '.avif']);
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a'
]);

export class MediaService {
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async hasPhysicalFile(media: MediaFile): Promise<boolean> {
    const candidates = new Set<string>();
    if (media.storedName) candidates.add(media.storedName);
    const fromUrl = path.basename(String(media.url ?? '').replace(/\\/g, '/'));
    if (fromUrl) candidates.add(fromUrl);

    for (const name of candidates) {
      for (const uploadDir of UPLOADS_DIR_CANDIDATES) {
        const fullPath = path.join(uploadDir, name);
        if (await this.fileExists(fullPath)) return true;
      }
    }
    return false;
  }

  private async pruneStaleMediaEntries(): Promise<void> {
    const allMedia = store.listMedia();
    const staleIds: string[] = [];
    for (const media of allMedia) {
      const exists = await this.hasPhysicalFile(media);
      if (!exists) staleIds.push(media.id);
    }
    if (staleIds.length === 0) return;
    for (const id of staleIds) {
      await store.deleteMedia(id);
    }
  }

  detectMediaKind(mimeType: string): MediaFile['kind'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  }

  validateFile(file: Express.Multer.File): void {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImage = file.mimetype.startsWith('image/') || ALLOWED_IMAGE_EXTENSIONS.has(ext);
    const isPdf = file.mimetype === 'application/pdf';
    const isAllowedAudio = ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype);
    if (!isImage && !isPdf && !isAllowedAudio) {
      throw new Error('Unsupported file type');
    }

    const MAX_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 15 * 1024 * 1024);
    if (file.size > MAX_SIZE) {
      throw new Error(`File exceeds the ${Math.round(MAX_SIZE / (1024 * 1024))}MB size limit.`);
    }
  }

  async createMedia(file: Express.Multer.File): Promise<MediaFile> {
    this.validateFile(file);

    const media = await store.createMedia({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      kind: this.detectMediaKind(file.mimetype)
    });

    return media;
  }

  async listMedia(filters?: { search?: string; kind?: MediaFile['kind']; page?: number; pageSize?: number }) {
    await this.pruneStaleMediaEntries();
    const all = store.listMedia({ search: filters?.search, kind: filters?.kind });
    const page = Math.max(1, Number(filters?.page ?? 1) || 1);
    const pageSize = Math.min(1000, Math.max(1, Number(filters?.pageSize ?? 100) || 100));
    const start = (page - 1) * pageSize;
    const media = all.slice(start, start + pageSize);
    return {
      media,
      meta: {
        page,
        pageSize,
        total: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / pageSize))
      }
    };
  }

  async deleteMedia(id: string) {
    const media = await store.deleteMedia(id);
    if (!media) {
      throw new Error('File not found.');
    }

    // Delete physical file
    const filePath = path.join(UPLOADS_DIR, media.storedName);
    await fs.rm(filePath, { force: true });

    return media;
  }
}