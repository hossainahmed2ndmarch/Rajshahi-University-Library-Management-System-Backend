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
exports.BorrowController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const borrow_service_1 = require("./borrow.service");
const createBorrow = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = req.body.userId ? Number(req.body.userId) : Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield borrow_service_1.BorrowService.createBorrowInDB(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Borrow request submitted successfully! Pending shifter/admin approval.',
        data: result,
    });
}));
const issueBook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const shifterId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield borrow_service_1.BorrowService.issueBookDirectlyInDB({
        bookId: Number(req.body.bookId),
        memberId: req.body.memberId ? Number(req.body.memberId) : undefined,
        studentOrVoterId: req.body.studentOrVoterId,
        memberPhone: req.body.memberPhone,
        memberEmail: req.body.memberEmail,
        dueDate: req.body.dueDate,
        notes: req.body.notes,
    }, shifterId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Book issued directly to member successfully at counter desk!',
        data: result,
    });
}));
const returnBook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const returnedById = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield borrow_service_1.BorrowService.returnBookInDB(Number(id), returnedById, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Book returned successfully and inventory updated!',
        data: result,
    });
}));
const getMyBorrows = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const scopedQuery = Object.assign(Object.assign({}, req.query), { userId: String(userId) });
    const user = {
        userId,
        role: 'MEMBER',
    };
    const result = yield borrow_service_1.BorrowService.getAllBorrowsFromDB(scopedQuery, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'My borrow history retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const approveBorrow = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const approvedById = Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const result = yield borrow_service_1.BorrowService.approveBorrowInDB(Number(id), approvedById);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Borrow request approved successfully with dynamic due date!',
        data: result,
    });
}));
const rejectBorrow = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield borrow_service_1.BorrowService.rejectBorrowInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Borrow request rejected successfully!',
        data: result,
    });
}));
const getAllBorrows = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const user = {
        userId: Number(((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)),
        role: (_c = req.user) === null || _c === void 0 ? void 0 : _c.role,
    };
    const result = yield borrow_service_1.BorrowService.getAllBorrowsFromDB(req.query, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All borrow records retrieved successfully!',
        meta: result.meta,
        data: result.data,
    });
}));
const checkOverdueBorrows = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield borrow_service_1.BorrowService.checkOverdueBorrowsAndNotify();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Overdue check executed! Processed ${result.totalChecked} overdue borrow(s).`,
        data: result,
    });
}));
const deleteBorrow = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield borrow_service_1.BorrowService.deleteBorrowInDB(Number(id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Borrow record deleted successfully!',
        data: result,
    });
}));
exports.BorrowController = {
    createBorrow,
    issueBook,
    approveBorrow,
    rejectBorrow,
    returnBook,
    getMyBorrows,
    getAllBorrows,
    checkOverdueBorrows,
    deleteBorrow,
};
