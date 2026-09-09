"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
/**
 * Cloudinary SDK instance — shared utility for server-side operations
 * (e.g. deleting images by public_id).
 *
 * The SDK is already configured inside src/app/middlewares/uploadImage.ts
 * for Multer/CloudinaryStorage usage. This re-exports the same configured
 * instance so any service layer code can import it directly without
 * re-configuring.
 */
var uploadImage_1 = require("../app/middlewares/uploadImage");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return uploadImage_1.cloudinary; } });
