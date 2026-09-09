"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const borrow_controller_1 = require("./borrow.controller");
const borrow_validation_1 = require("./borrow.validation");
const router = (0, express_1.Router)();
// 1. Member / Any user requests to borrow a book
router.post('/', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(borrow_validation_1.BorrowValidation.createBorrowValidationSchema), borrow_controller_1.BorrowController.createBorrow);
// 2. Direct book issue by Shifter / Admin / Super Admin
router.post('/issue', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.issueBook);
// 3. Member fetches their own borrow records
router.get('/my-borrows', (0, auth_1.default)(client_1.UserRole.MEMBER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.getMyBorrows);
// 4. Staff fetches all borrow records
router.get('/', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.getAllBorrows);
// 5. Staff triggers overdue check & notifications manually/programmatically
router.post('/check-overdue', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.checkOverdueBorrows);
// 6. Staff approves borrow request (calculates due date & decrements stock)
router.patch('/approve/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.approveBorrow);
// 7. Staff rejects borrow request
router.patch('/reject/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), borrow_controller_1.BorrowController.rejectBorrow);
// 8. Staff processes book return (restores stock & sets return date)
router.patch('/return/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.SHIFTER), (0, validateRequest_1.default)(borrow_validation_1.BorrowValidation.returnBorrowValidationSchema), borrow_controller_1.BorrowController.returnBook);
// 9. Super Admin & Admin delete borrow audit record
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), borrow_controller_1.BorrowController.deleteBorrow);
exports.BorrowRoutes = router;
