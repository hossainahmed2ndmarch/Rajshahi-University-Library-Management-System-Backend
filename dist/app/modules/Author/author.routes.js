"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const author_controller_1 = require("./author.controller");
const author_validation_1 = require("./author.validation");
const router = (0, express_1.Router)();
// Public Read
router.get('/', author_controller_1.AuthorController.getAllAuthors);
router.get('/:id', author_controller_1.AuthorController.getAuthorById);
// Upload Avatar
router.post('/upload-avatar', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), uploadImage_1.uploadAuthorAvatar, author_controller_1.AuthorController.uploadAvatar);
// Staff Management (Shifter, Admin, Super Admin)
router.post('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(author_validation_1.AuthorValidation.createAuthorValidationSchema), author_controller_1.AuthorController.createAuthor);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(author_validation_1.AuthorValidation.updateAuthorValidationSchema), author_controller_1.AuthorController.updateAuthor);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), author_controller_1.AuthorController.deleteAuthor);
exports.AuthorRoutes = router;
