"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const book_service_1 = require("./book.service");
const createBook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) ? Number(req.user.userId) : undefined;
    const result = yield book_service_1.BookService.createBookIntoDB(req.body, adminId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Book created successfully!',
        data: result,
    });
}));
const getAllBooks = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield book_service_1.BookService.getAllBooksFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Books catalog retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const getBookById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield book_service_1.BookService.getBookByIdFromDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book details retrieved successfully!',
        data: result,
    });
}));
const updateBook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield book_service_1.BookService.updateBookInDB(Number(id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book updated successfully!',
        data: result,
    });
}));
const deleteBook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield book_service_1.BookService.deleteBookFromDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book archived successfully!',
        data: result,
    });
}));
const getBookCategories = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield book_service_1.BookService.getBookCategoriesFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book categories retrieved successfully!',
        data: result,
    });
}));
/**
 * POST /books/upload-cover
 * Uploads a book cover image to Cloudinary and returns the secure URL.
 * Optionally, if a bookId is provided in the body, it immediately updates
 * the book record's coverImage field in the database.
 */
const uploadBookCover = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const file = req.file;
    if (!file) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Please select an image file to upload!',
            data: null,
        });
    }
    // CloudinaryStorage sets req.file.path or req.file.secure_url to the Cloudinary HTTPS URL
    const coverImageUrl = (file.path || file.secure_url || file.url);
    if (!coverImageUrl) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to retrieve uploaded image URL from Cloudinary.',
            data: null,
        });
    }
    // If a bookId was provided, persist the URL directly to the book record
    const bookId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.bookId) ? Number(req.body.bookId) : undefined;
    if (bookId) {
        yield book_service_1.BookService.updateBookInDB(bookId, { coverImage: coverImageUrl });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book cover image uploaded to Cloudinary successfully!',
        data: { url: coverImageUrl },
    });
}));
/**
 * POST /books/upload-images
 * Uploads multiple book images (e.g. preview pages, inside photos) to Cloudinary
 * and returns an array of secure URLs.
 */
const uploadBookImages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = req.files || [];
    if (!files || files.length === 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Please select one or more image files to upload!',
            data: null,
        });
    }
    const urls = files
        .map((file) => (file.path || file.secure_url || file.url))
        .filter(Boolean);
    if (urls.length === 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to retrieve uploaded image URLs from Cloudinary.',
            data: null,
        });
    }
    const bookId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.bookId) ? Number(req.body.bookId) : undefined;
    if (bookId) {
        const existingBook = yield book_service_1.BookService.getBookByIdFromDB(bookId);
        const updatedImages = Array.from(new Set([...(existingBook.images || []), ...urls]));
        yield book_service_1.BookService.updateBookInDB(bookId, { images: updatedImages });
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `${urls.length} book image(s) uploaded to Cloudinary successfully!`,
        data: { urls },
    });
}));
exports.BookController = {
    createBook,
    getAllBooks,
    getBookById,
    getBookCategories,
    updateBook,
    deleteBook,
    uploadBookCover,
    uploadBookImages,
};
