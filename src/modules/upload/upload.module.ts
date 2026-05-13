import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';

/**
 * UploadModule is a shared utility module.
 *
 * Import it in any feature module that needs file upload support:
 *   - UsersModule  (avatar)
 *   - PostsModule  (post media — coming next)
 *   - ChatModule   (chat attachments)
 *
 * It does NOT expose a controller of its own; each feature module
 * owns its upload endpoint and calls UploadService to persist the file.
 */
@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}