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

// ── Cloudinary storage: Article Cover Images ─────────────────────────────────
const articleCoverStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
    ],
  },
});

export const uploadArticleCover = multer({
  storage: articleCoverStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('image');

// ── Cloudinary storage: Activity Banner ──────────────────────────────────────
const activityBannerStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/activities',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1200, height: 630, crop: 'limit', quality: 'auto' },
    ],
  },
});

export const uploadActivityBanner = multer({
  storage: activityBannerStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('banner');

// ── Cloudinary storage: Event Banner ─────────────────────────────────────────
const eventBannerStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1200, height: 630, crop: 'limit', quality: 'auto' },
    ],
  },
});

export const uploadEventBanner = multer({
  storage: eventBannerStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('banner');

// ── Audio filter & Cloudinary storage: Session Audio ─────────────────────────
const audioFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedAudio = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
    'audio/webm',
    'audio/flac',
  ];
  if (allowedAudio.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        'Only audio files (MP3, WAV, AAC, M4A, OGG, WEBM, FLAC) are allowed!'
      )
    );
  }
};

const sessionAudioStorage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ruil-library/sessions/audio',
    resource_type: 'auto',
  },
});

export const uploadSessionAudio = multer({
  storage: sessionAudioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB max
}).single('audio');

// Legacy alias kept for backward compat
export const uploadSingleImage = uploadBookCover;

const cloudinaryV2 = cloudinary.v2;
export { cloudinaryV2 as cloudinary };
