import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('upload', () => ({
  // Root uploads directory (relative to project root)
  uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),

  // Base URL for serving static files (used to build the stored URL)
  baseUrl: process.env.UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  // Max file sizes in bytes
  maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || String(5 * 1024 * 1024), 10),   // 5 MB
  maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE || String(100 * 1024 * 1024), 10), // 100 MB
  maxFileSize:  parseInt(process.env.MAX_FILE_SIZE  || String(20 * 1024 * 1024), 10),  // 20 MB

  // Allowed MIME types per category
  allowedImageMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoMimes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  allowedFileMimes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}));