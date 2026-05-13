/**
 * UploadContext defines WHERE a file is being uploaded to.
 * This drives:
 *  - Which sub-directory on disk the file lands in
 *  - Which MIME types are allowed
 *  - Which size limit applies
 *  - What URL prefix is returned
 *
 * Current contexts:
 *   AVATAR  → user profile picture         → uploads/avatars/
 *   POST    → image/video attached to post  → uploads/posts/
 *   CHAT    → media sent in a message       → uploads/chat/
 *   MISC    → catch-all (documents, etc.)   → uploads/misc/
 *
 * When the posts module is added, use UploadContext.POST so all post
 * media is consistently stored under uploads/posts/.
 */
export enum UploadContext {
  AVATAR = 'avatar',
  POST   = 'post',
  CHAT   = 'chat',
  MISC   = 'misc',
}

/** Maps each context to its disk sub-directory name */
export const UPLOAD_CONTEXT_DIR: Record<UploadContext, string> = {
  [UploadContext.AVATAR]: 'avatars',
  [UploadContext.POST]:   'posts',
  [UploadContext.CHAT]:   'chat',
  [UploadContext.MISC]:   'misc',
};