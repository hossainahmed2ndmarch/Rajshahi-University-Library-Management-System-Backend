/**
 * Cloudinary SDK instance — shared utility for server-side operations
 * (e.g. deleting images by public_id).
 *
 * The SDK is already configured inside src/app/middlewares/uploadImage.ts
 * for Multer/CloudinaryStorage usage. This re-exports the same configured
 * instance so any service layer code can import it directly without
 * re-configuring.
 */
export { cloudinary } from '../app/middlewares/uploadImage';
