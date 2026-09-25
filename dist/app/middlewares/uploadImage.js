"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.uploadSingleImage = exports.uploadSessionAudio = exports.uploadGalleryMedia = exports.uploadEventBanner = exports.uploadActivityBanner = exports.uploadArticleCover = exports.uploadMultipleBookImages = exports.uploadBookCover = exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_storage_cloudinary_1 = __importDefault(require("multer-storage-cloudinary"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
// ── Initialise Cloudinary SDK ────────────────────────────────────────────────
cloudinary_1.default.v2.config({
    cloud_name: config_1.default.cloudinary.cloud_name,
    api_key: config_1.default.cloudinary.api_key,
    api_secret: config_1.default.cloudinary.api_secret,
});
// ── Common image filter ──────────────────────────────────────────────────────
const imageFileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Only JPEG, PNG, WEBP, GIF, or AVIF images are allowed!'));
    }
};
// ── Cloudinary storage: User Avatars ─────────────────────────────────────────
const avatarStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
        ],
    },
});
// ── Cloudinary storage: Book Cover Images ────────────────────────────────────
const bookCoverStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/books',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [
            { width: 800, height: 1200, crop: 'limit', quality: 'auto' },
        ],
    },
});
// ── Exports ──────────────────────────────────────────────────────────────────
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');
exports.uploadBookCover = (0, multer_1.default)({
    storage: bookCoverStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
}).single('image');
exports.uploadMultipleBookImages = (0, multer_1.default)({
    storage: bookCoverStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
}).array('images', 10);
// ── Cloudinary storage: Article Cover Images ─────────────────────────────────
const articleCoverStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/articles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
        ],
    },
});
exports.uploadArticleCover = (0, multer_1.default)({
    storage: articleCoverStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
}).single('image');
// ── Cloudinary storage: Activity Banner ──────────────────────────────────────
const activityBannerStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/activities',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [
            { width: 1200, height: 630, crop: 'limit', quality: 'auto' },
        ],
    },
});
exports.uploadActivityBanner = (0, multer_1.default)({
    storage: activityBannerStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('banner');
// ── Cloudinary storage: Event Banner ─────────────────────────────────────────
const eventBannerStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/events',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [
            { width: 1200, height: 630, crop: 'limit', quality: 'auto' },
        ],
    },
});
exports.uploadEventBanner = (0, multer_1.default)({
    storage: eventBannerStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('banner');
// ── Cloudinary storage: Gallery & Asset Media ──────────────────────────────
const galleryMediaStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'],
        transformation: [
            { quality: 'auto', fetch_format: 'auto' },
        ],
    },
});
exports.uploadGalleryMedia = (0, multer_1.default)({
    storage: galleryMediaStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 },
}).single('file');
// ── Audio filter & Cloudinary storage: Session Audio ─────────────────────────
const audioFileFilter = (_req, file, cb) => {
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
    }
    else {
        cb(new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Only audio files (MP3, WAV, AAC, M4A, OGG, WEBM, FLAC) are allowed!'));
    }
};
const sessionAudioStorage = (0, multer_storage_cloudinary_1.default)({
    cloudinary: cloudinary_1.default,
    params: {
        folder: 'ruil-library/sessions/audio',
        resource_type: 'auto',
    },
});
exports.uploadSessionAudio = (0, multer_1.default)({
    storage: sessionAudioStorage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 60 * 1024 * 1024 }, // 60MB max
}).single('audio');
// Legacy alias kept for backward compat
exports.uploadSingleImage = exports.uploadBookCover;
const cloudinaryV2 = cloudinary_1.default.v2;
exports.cloudinary = cloudinaryV2;
