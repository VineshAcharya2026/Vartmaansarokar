import path from 'path';
import { promises as fs } from 'fs';
import { sharedStore as store } from '../store.js';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
]);
export class MediaService {
    detectMediaKind(mimeType) {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType === 'application/pdf')
            return 'pdf';
        if (mimeType.startsWith('audio/'))
            return 'audio';
        return 'other';
    }
    validateFile(file) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new Error('Unsupported file type');
        }
        const MAX_SIZE = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 15 * 1024 * 1024);
        if (file.size > MAX_SIZE) {
            throw new Error(`File exceeds the ${Math.round(MAX_SIZE / (1024 * 1024))}MB size limit.`);
        }
    }
    async createMedia(file) {
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
    listMedia(filters) {
        return store.listMedia(filters);
    }
    async deleteMedia(id) {
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
