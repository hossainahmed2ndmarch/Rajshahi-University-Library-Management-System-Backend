"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const uploadImage_1 = require("../../middlewares/uploadImage");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
// 1. Public Statistics (No login required - member counts for landing pages)
router.get('/public-stats', user_controller_1.UserController.getPublicStats);
// 2. Member & User Registration
router.post('/register', (0, validateRequest_1.default)(user_validation_1.UserValidation.registerMemberValidationSchema), user_controller_1.UserController.registerUser);
// 3. Bulk Manual Registration by Admin / Shifter
router.post('/bulk-register', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), user_controller_1.UserController.registerBulkMembers);
// 4. Listing & Profile Access
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), user_controller_1.UserController.getAllUsers);
router.get('/me', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER, client_1.UserRole.GENERAL_USER), user_controller_1.UserController.getMe);
router.patch('/profile', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER, client_1.UserRole.GENERAL_USER), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateMyProfileValidationSchema), user_controller_1.UserController.updateMyProfile);
router.post('/avatar', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER, client_1.UserRole.GENERAL_USER), uploadImage_1.uploadAvatar, user_controller_1.UserController.uploadAvatar);
router.post('/renew-membership', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), (0, validateRequest_1.default)(user_validation_1.UserValidation.renewMembershipValidationSchema), user_controller_1.UserController.renewMembership);
// 5. Bulk Actions for Admin
router.post('/convert-membership', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.convertMembership);
router.patch('/bulk-update', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.bulkUpdateUsers);
router.post('/bulk-delete', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.bulkDeleteUsers);
router.get('/notice-templates', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), user_controller_1.UserController.getEmailNoticeTemplates);
router.post('/send-custom-notice', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.sendCustomNotice);
router.get('/options', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), user_controller_1.UserController.getUserOptions);
router.get('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER, client_1.UserRole.MEMBER), user_controller_1.UserController.getUserById);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserValidationSchema), user_controller_1.UserController.updateUser);
router.patch('/:id/approve-cash', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), user_controller_1.UserController.approveCashPayment);
router.post('/:id/send-notice', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.sendNoticeToUser);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), user_controller_1.UserController.deleteUser);
exports.UserRoutes = router;
