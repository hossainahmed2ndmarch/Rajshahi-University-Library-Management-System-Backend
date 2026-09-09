import multer from 'multer';
import cloudinary from 'cloudinary';
import cloudinaryStorage from 'multer-storage-cloudinary';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';
import config from '../config';

// ── Initialise Cloudinary SDK ────────────────────────────────────────────────
cloudinary.v2.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// ── Common image filter ──────────────────────────────────────────────────────
const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        'Only JPEG, PNG, WEBP, GIF, or AVIF images are allowed!'
      )
    );
  }
};

// ── Cloudinary storage: User Avatars ─────────────────────────────────────────
const avatarStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
    ],
  },
});

// ── Cloudinary storage: Book Cover Images ────────────────────────────────────
const bookCoverStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/books',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 800, height: 1200, crop: 'limit', quality: 'auto' },
    ],
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

export const uploadBookCover = multer({
  storage: bookCoverStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('image');

export const uploadMultipleBookImages = multer({
  storage: bookCoverStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).array('images', 10);

// Legacy alias kept for backward compat
export const uploadSingleImage = uploadBookCover;

const cloudinaryV2 = cloudinary.v2;
export { cloudinaryV2 as cloudinary };
