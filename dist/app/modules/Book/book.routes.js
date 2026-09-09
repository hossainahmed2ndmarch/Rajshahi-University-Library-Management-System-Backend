"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const book_controller_1 = require("./book.controller");
const book_validation_1 = require("./book.validation");
const uploadImage_1 = require("../../middlewares/uploadImage");
const router = (0, express_1.Router)();
// ── Upload book cover image to Cloudinary ─────────────────────────────────────
router.post('/upload-cover', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), uploadImage_1.uploadBookCover, book_controller_1.BookController.uploadBookCover);
// ── Upload multiple book images to Cloudinary ─────────────────────────────────
router.post('/upload-images', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), uploadImage_1.uploadMultipleBookImages, book_controller_1.BookController.uploadBookImages);
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(book_validation_1.BookValidation.createBookValidationSchema), book_controller_1.BookController.createBook);
router.get('/', book_controller_1.BookController.getAllBooks);
router.get('/categories', book_controller_1.BookController.getBookCategories);
router.get('/:id', book_controller_1.BookController.getBookById);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(book_validation_1.BookValidation.updateBookValidationSchema), book_controller_1.BookController.updateBook);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), book_controller_1.BookController.deleteBook);
exports.BookRoutes = router;
