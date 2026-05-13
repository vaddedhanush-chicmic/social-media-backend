import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { UploadContext, UPLOAD_CONTEXT_DIR } from './upload.constants';

export interface UploadResult {
  url: string;       // Public URL stored in DB  e.g. http://localhost:3000/uploads/avatars/uid-timestamp.jpg
  filePath: string;  // Absolute path on disk    e.g. /app/uploads/avatars/uid-timestamp.jpg
  fileName: string;  // Generated file name       e.g. uid-timestamp.jpg
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly maxImageSize: number;
  private readonly maxVideoSize: number;
  private readonly maxFileSize: number;
  private readonly allowedImageMimes: string[];
  private readonly allowedVideoMimes: string[];
  private readonly allowedFileMimes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir      = this.configService.get<string>('upload.uploadDir')!;
    this.baseUrl        = this.configService.get<string>('upload.baseUrl')!;
    this.maxImageSize   = this.configService.get<number>('upload.maxImageSize')!;
    this.maxVideoSize   = this.configService.get<number>('upload.maxVideoSize')!;
    this.maxFileSize    = this.configService.get<number>('upload.maxFileSize')!;
    this.allowedImageMimes = this.configService.get<string[]>('upload.allowedImageMimes')!;
    this.allowedVideoMimes = this.configService.get<string[]>('upload.allowedVideoMimes')!;
    this.allowedFileMimes  = this.configService.get<string[]>('upload.allowedFileMimes')!;

    // Ensure all context directories exist on startup
    this.ensureDirectories();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Validate and persist a multer file to disk.
   * Returns a public URL (stored in MongoDB) and the absolute disk path.
   */
  async saveFile(
    file: Express.Multer.File,
    context: UploadContext,
    userId: string,
  ): Promise<UploadResult> {
    // 1. Validate MIME type & size for the context
    this.validateFile(file, context);

    // 2. Build destination path
    const subDir   = UPLOAD_CONTEXT_DIR[context];
    const destDir  = join(this.uploadDir, subDir);
    const fileName = this.generateFileName(userId, file.originalname); 
    const filePath = join(destDir, fileName);

    // 3. Write buffer to disk
    try {
      await writeFile(filePath, file.buffer);
    } catch (err) {
      this.logger.error(`Failed to write file: ${filePath}`, err);
      throw new InternalServerErrorException('Failed to save file');
    }

    // 4. Build public URL  →  <baseUrl>/uploads/<subDir>/<fileName>
    const url = `${this.baseUrl}/uploads/${subDir}/${fileName}`;

    this.logger.log(`Saved [${context}] file: ${fileName} (${file.size} bytes)`);

    return {
      url,
      filePath,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Delete a file from disk given its public URL.
   * Silently ignores missing files (idempotent).
   */
  deleteFileByUrl(url: string): void {
    try {
      const filePath = this.urlToFilePath(url);
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      }
    } catch (err) {
      // Log but do not throw — deletion failure should not block a response
      this.logger.warn(`Could not delete file for URL "${url}": ${err.message}`);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private validateFile(file: Express.Multer.File, context: UploadContext): void {
    const mime = file.mimetype;

    // Avatar: only images
    if (context === UploadContext.AVATAR) {
      if (!this.allowedImageMimes.includes(mime)) {
        throw new BadRequestException(
          `Avatar must be an image. Allowed: ${this.allowedImageMimes.join(', ')}`,
        );
      }
      if (file.size > this.maxImageSize) {
        throw new BadRequestException(
          `Avatar image too large. Max: ${this.maxImageSize / 1024 / 1024} MB`,
        );
      }
      return;
    }

    // Post: images or videos
    if (context === UploadContext.POST) {
      const allowed = [...this.allowedImageMimes, ...this.allowedVideoMimes];
      if (!allowed.includes(mime)) {
        throw new BadRequestException(
          `Post media must be an image or video. Allowed: ${allowed.join(', ')}`,
        );
      }
      const limit = this.allowedVideoMimes.includes(mime)
        ? this.maxVideoSize
        : this.maxImageSize;
      if (file.size > limit) {
        const limitMb = limit / 1024 / 1024;
        throw new BadRequestException(`File too large for post. Max: ${limitMb} MB`);
      }
      return;
    }

    // Chat: images, videos, or documents
    if (context === UploadContext.CHAT) {
      const allowed = [
        ...this.allowedImageMimes,
        ...this.allowedVideoMimes,
        ...this.allowedFileMimes,
      ];
      if (!allowed.includes(mime)) {
        throw new BadRequestException(`File type "${mime}" not allowed in chat`);
      }
      const limit = this.allowedVideoMimes.includes(mime)
        ? this.maxVideoSize
        : this.allowedImageMimes.includes(mime)
          ? this.maxImageSize
          : this.maxFileSize;
      if (file.size > limit) {
        throw new BadRequestException(`File too large. Max: ${limit / 1024 / 1024} MB`);
      }
      return;
    }

    // Misc: documents
    if (context === UploadContext.MISC) {
      const allowed = [...this.allowedFileMimes, ...this.allowedImageMimes];
      if (!allowed.includes(mime)) {
        throw new BadRequestException(`File type "${mime}" not allowed`);
      }
      if (file.size > this.maxFileSize) {
        throw new BadRequestException(
          `File too large. Max: ${this.maxFileSize / 1024 / 1024} MB`,
        );
      }
    }
  }

  /** Converts a public URL back to an absolute disk path */
  private urlToFilePath(url: string): string | null {
    try {
      // url = <baseUrl>/uploads/<subDir>/<fileName>
      const urlObj  = new URL(url);
      // pathname = /uploads/<subDir>/<fileName>
      const relative = urlObj.pathname.replace(/^\/uploads\//, '');
      return join(this.uploadDir, relative);
    } catch {
      return null;
    }
  }

  /** UUID-based filename preserving original extension */
  private generateFileName(userId: string, originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    return `${userId}-${Date.now()}${ext}`;
  }

  /** Make sure every context sub-directory exists on disk */
  private ensureDirectories(): void {
    for (const subDir of Object.values(UPLOAD_CONTEXT_DIR)) {
      const dir = join(this.uploadDir, subDir);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.logger.log(`Created upload directory: ${dir}`);
      }
    }
  }
}