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
exports.PurchaseService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const normalizeItems = (payload) => {
    if (payload.items && payload.items.length > 0) {
        return payload.items;
    }
    if (payload.bookId) {
        return [{ bookId: payload.bookId, quantity: payload.quantity || 1 }];
    }
    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'No purchase items provided!');
};
const createGuestPurchaseInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const customerName = payload.guestName || payload.customerName;
    const customerEmail = payload.guestEmail || payload.customerEmail;
    const customerPhone = payload.guestPhone || payload.customerPhone;
    const shippingAddress = payload.address || payload.shippingAddress;
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Missing required guest contact information!');
    }
    const items = normalizeItems(payload);
    const validatedItems = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const book = yield db_1.default.book.findUnique({
            where: { id: item.bookId },
        });
        if (!book) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
        }
        if (book.type === client_1.BookType.BORROW_ONLY) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
        }
        if (book.sellPrice == null || book.sellPrice <= 0) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
        }
        if (book.sellStock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for "${book.title}". Available: ${book.sellStock}, requested: ${item.quantity}.`);
        }
        return {
            book,
            quantity: item.quantity,
            unitPrice: book.sellPrice,
            totalAmount: book.sellPrice * item.quantity,
        };
    })));
    const baseTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdPurchases = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const results = [];
        for (let i = 0; i < validatedItems.length; i++) {
            const item = validatedItems[i];
            const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;
            yield tx.book.update({
                where: { id: item.book.id },
                data: {
                    sellStock: {
                        decrement: item.quantity,
                    },
                },
            });
            const purchase = yield tx.purchase.create({
                data: {
                    transactionId: txnId,
                    userId: null,
                    customerName,
                    customerEmail,
                    customerPhone,
                    shippingAddress,
                    bookId: item.book.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalAmount: item.totalAmount,
                    paymentMethod,
                    orderStatus: client_1.OrderStatus.PENDING,
                    paymentStatus: client_1.PaymentStatus.PENDING,
                },
                include: {
                    book: true,
                },
            });
            results.push(purchase);
        }
        return results;
    }));
    return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
});
const createMemberPurchaseInDB = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const customerName = payload.customerName || user.name;
    const customerEmail = payload.customerEmail || user.email;
    const customerPhone = payload.customerPhone || user.phone;
    const shippingAddress = payload.shippingAddress || payload.address;
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    if (!shippingAddress) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Shipping address is required!');
    }
    const items = normalizeItems(payload);
    const validatedItems = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const book = yield db_1.default.book.findUnique({
            where: { id: item.bookId },
        });
        if (!book) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
        }
        if (book.type === client_1.BookType.BORROW_ONLY) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
        }
        if (book.sellPrice == null || book.sellPrice <= 0) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
        }
        if (book.sellStock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for "${book.title}". Available: ${book.sellStock}, requested: ${item.quantity}.`);
        }
        return {
            book,
            quantity: item.quantity,
            unitPrice: book.sellPrice,
            totalAmount: book.sellPrice * item.quantity,
        };
    })));
    const baseTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdPurchases = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const results = [];
        for (let i = 0; i < validatedItems.length; i++) {
            const item = validatedItems[i];
            const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;
            yield tx.book.update({
                where: { id: item.book.id },
                data: {
                    sellStock: {
                        decrement: item.quantity,
                    },
                },
            });
            const purchase = yield tx.purchase.create({
                data: {
                    transactionId: txnId,
                    userId,
                    customerName,
                    customerEmail,
                    customerPhone,
                    shippingAddress,
                    bookId: item.book.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalAmount: item.totalAmount,
                    paymentMethod,
                    orderStatus: client_1.OrderStatus.PENDING,
                    paymentStatus: client_1.PaymentStatus.PENDING,
                },
                include: {
                    book: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            yield tx.payment.create({
                data: {
                    transactionId: txnId,
                    userId,
                    amount: item.totalAmount,
                    paymentMethod,
                    status: client_1.PaymentStatus.PENDING,
                },
            });
            results.push(purchase);
        }
        return results;
    }));
    return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
});
const getAllPurchasesFromDB = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = Object.assign({}, query);
    if (user && user.role === client_1.UserRole.MEMBER) {
        queryParams.userId = user.userId;
    }
    const purchaseQuery = new queryBuilder_1.default(db_1.default.purchase, queryParams, {
        searchableFields: ['transactionId', 'customerName', 'customerEmail', 'customerPhone', 'book.title'],
        filterableFields: ['orderStatus', 'paymentStatus', 'paymentMethod', 'userId', 'bookId', 'transactionId'],
    })
        .search()
        .filter()
        .sort()
        .paginate()
        .include({
        book: true,
        user: {
            select: {
                id: true,
                name: true,
                email: true,
            },
        },
    });
    return yield purchaseQuery.execute();
});
const getGuestOrdersFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone, transactionId } = payload;
    if (!email && !phone && !transactionId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email, phone, or transaction ID is required to lookup guest orders!');
    }
    const whereConditions = [];
    if (email) {
        whereConditions.push({ customerEmail: { equals: email.trim(), mode: 'insensitive' } });
    }
    if (phone) {
        whereConditions.push({ customerPhone: { contains: phone.trim() } });
    }
    if (transactionId) {
        whereConditions.push({ transactionId: { equals: transactionId.trim() } });
    }
    const purchases = yield db_1.default.purchase.findMany({
        where: {
            OR: whereConditions,
        },
        include: {
            book: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return purchases;
});
const trackGuestOrderByTxnIdFromDB = (transactionId, email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!transactionId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Transaction ID is required for tracking!');
    }
    const purchase = yield db_1.default.purchase.findUnique({
        where: { transactionId: transactionId.trim() },
        include: {
            book: true,
        },
    });
    if (!purchase) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Order with tracking code #${transactionId} not found!`);
    }
    if (email && purchase.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'The provided email does not match the order records.');
    }
    return purchase;
});
const cancelGuestPurchaseInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { transactionId, email } = payload;
    const purchase = yield db_1.default.purchase.findUnique({
        where: { transactionId: transactionId.trim() },
        include: { book: true },
    });
    if (!purchase) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Order with transaction #${transactionId} not found!`);
    }
    if (purchase.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Email address does not match this order reference.');
    }
    if (purchase.orderStatus !== client_1.OrderStatus.PENDING) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot cancel order with status "${purchase.orderStatus}". Only PENDING orders can be cancelled.`);
    }
    // Transactionally update status to CANCELLED and restock book quantity
    const updatedPurchase = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Restock book sell inventory
        yield tx.book.update({
            where: { id: purchase.bookId },
            data: {
                sellStock: {
                    increment: purchase.quantity,
                },
            },
        });
        // Update purchase status
        const cancelled = yield tx.purchase.update({
            where: { id: purchase.id },
            data: {
                orderStatus: client_1.OrderStatus.CANCELLED,
                paymentStatus: client_1.PaymentStatus.CANCELLED,
            },
            include: {
                book: true,
            },
        });
        return cancelled;
    }));
    return updatedPurchase;
});
const cancelMemberPurchaseInDB = (purchaseId, userId, userRole, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const purchase = yield db_1.default.purchase.findUnique({
        where: { id: purchaseId },
        include: { book: true },
    });
    if (!purchase) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Purchase record not found!');
    }
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'SHIFTER'].includes(userRole);
    if (!isStaff && purchase.userId !== userId) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to cancel this purchase.');
    }
    if (purchase.orderStatus !== client_1.OrderStatus.PENDING) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot cancel order with status "${purchase.orderStatus}". Only PENDING orders can be cancelled.`);
    }
    // Transactionally update status to CANCELLED and restock book quantity
    const updatedPurchase = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.book.update({
            where: { id: purchase.bookId },
            data: {
                sellStock: {
                    increment: purchase.quantity,
                },
            },
        });
        const cancelled = yield tx.purchase.update({
            where: { id: purchase.id },
            data: {
                orderStatus: client_1.OrderStatus.CANCELLED,
                paymentStatus: client_1.PaymentStatus.CANCELLED,
            },
            include: {
                book: true,
            },
        });
        // Also update associated payment record if exists
        yield tx.payment.updateMany({
            where: { transactionId: purchase.transactionId },
            data: {
                status: client_1.PaymentStatus.CANCELLED,
            },
        });
        return cancelled;
    }));
    return updatedPurchase;
});
const updatePurchaseStatusInDB = (purchaseId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const purchase = yield db_1.default.purchase.findUnique({
        where: { id: purchaseId },
        include: { book: true },
    });
    if (!purchase) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Purchase record not found!');
    }
    // If status is transitioning to CANCELLED and was not previously CANCELLED, restock book inventory
    if (payload.orderStatus === client_1.OrderStatus.CANCELLED &&
        purchase.orderStatus !== client_1.OrderStatus.CANCELLED) {
        return yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.book.update({
                where: { id: purchase.bookId },
                data: {
                    sellStock: {
                        increment: purchase.quantity,
                    },
                },
            });
            const updated = yield tx.purchase.update({
                where: { id: purchaseId },
                data: Object.assign({ orderStatus: client_1.OrderStatus.CANCELLED }, (payload.paymentStatus && { paymentStatus: payload.paymentStatus })),
                include: {
                    book: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            return updated;
        }));
    }
    const updated = yield db_1.default.purchase.update({
        where: { id: purchaseId },
        data: Object.assign(Object.assign({}, (payload.orderStatus && { orderStatus: payload.orderStatus })), (payload.paymentStatus && { paymentStatus: payload.paymentStatus })),
        include: {
            book: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    return updated;
});
const createPOSSaleInDB = (payload, shifterId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let userId = null;
    if (payload.buyerType === 'MEMBER') {
        let member = null;
        if (payload.memberId && !isNaN(Number(payload.memberId))) {
            member = yield db_1.default.user.findUnique({ where: { id: Number(payload.memberId) } });
        }
        if (!member && (payload.studentOrVoterId || payload.customerPhone || payload.customerEmail)) {
            const orClauses = [];
            if ((_a = payload.studentOrVoterId) === null || _a === void 0 ? void 0 : _a.trim())
                orClauses.push({ studentOrVoterId: payload.studentOrVoterId.trim() });
            if ((_b = payload.customerPhone) === null || _b === void 0 ? void 0 : _b.trim())
                orClauses.push({ phone: payload.customerPhone.trim() });
            if ((_c = payload.customerEmail) === null || _c === void 0 ? void 0 : _c.trim())
                orClauses.push({ email: payload.customerEmail.trim() });
            if (orClauses.length > 0) {
                member = yield db_1.default.user.findFirst({
                    where: { OR: orClauses },
                });
            }
        }
        if (member) {
            userId = member.id;
        }
    }
    const customerName = ((_d = payload.customerName) === null || _d === void 0 ? void 0 : _d.trim()) ||
        (userId ? ((_e = (yield db_1.default.user.findUnique({ where: { id: userId } }))) === null || _e === void 0 ? void 0 : _e.name) || 'Library Member' : 'Walk-in Guest');
    const customerPhone = ((_f = payload.customerPhone) === null || _f === void 0 ? void 0 : _f.trim()) ||
        (userId ? ((_g = (yield db_1.default.user.findUnique({ where: { id: userId } }))) === null || _g === void 0 ? void 0 : _g.phone) || 'N/A' : 'N/A');
    const rawDigits = customerPhone && customerPhone !== 'N/A' ? customerPhone.replace(/[^0-9]/g, '') : '';
    const customerEmail = ((_h = payload.customerEmail) === null || _h === void 0 ? void 0 : _h.trim()) ||
        (userId ? (_j = (yield db_1.default.user.findUnique({ where: { id: userId } }))) === null || _j === void 0 ? void 0 : _j.email : undefined) ||
        `${rawDigits || `pos_${Date.now()}`}@guest.ruil.ac.bd`;
    const shippingAddress = payload.shippingAddress || 'Counter Desk Pickup (POS Counter Sale)';
    const paymentMethod = payload.paymentMethod || client_1.PaymentMethod.CASH;
    const items = normalizeItems(payload);
    const validatedItems = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const book = yield db_1.default.book.findUnique({
            where: { id: item.bookId },
        });
        if (!book) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
        }
        if (book.type === client_1.BookType.BORROW_ONLY) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be sold!`);
        }
        if (book.sellPrice == null || book.sellPrice <= 0) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
        }
        if (book.sellStock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for "${book.title}". Available in stock: ${book.sellStock}, requested: ${item.quantity}.`);
        }
        return {
            book,
            quantity: item.quantity,
            unitPrice: book.sellPrice,
            totalAmount: book.sellPrice * item.quantity,
        };
    })));
    const baseTxnId = `POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdPurchases = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const results = [];
        for (let i = 0; i < validatedItems.length; i++) {
            const item = validatedItems[i];
            const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;
            yield tx.book.update({
                where: { id: item.book.id },
                data: {
                    sellStock: {
                        decrement: item.quantity,
                    },
                },
            });
            const purchase = yield tx.purchase.create({
                data: {
                    transactionId: txnId,
                    userId,
                    customerName,
                    customerEmail,
                    customerPhone,
                    shippingAddress,
                    bookId: item.book.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalAmount: item.totalAmount,
                    paymentMethod,
                    orderStatus: client_1.OrderStatus.DELIVERED,
                    paymentStatus: client_1.PaymentStatus.PAID,
                    approvedById: shifterId,
                },
                include: {
                    book: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            studentOrVoterId: true,
                        },
                    },
                },
            });
            if (userId) {
                yield tx.payment.create({
                    data: {
                        transactionId: txnId,
                        userId,
                        amount: item.totalAmount,
                        paymentMethod,
                        status: client_1.PaymentStatus.COMPLETED,
                        paidAt: new Date(),
                    },
                });
            }
            results.push(purchase);
        }
        return results;
    }));
    return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
});
const deletePurchaseInDB = (purchaseId) => __awaiter(void 0, void 0, void 0, function* () {
    const purchase = yield db_1.default.purchase.findUnique({
        where: { id: purchaseId },
    });
    if (!purchase) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Purchase order record not found!');
    }
    // If order was in pending or processing status and not delivered/cancelled, optionally restore stock
    if (purchase.orderStatus === client_1.OrderStatus.PENDING || purchase.orderStatus === client_1.OrderStatus.PROCESSING) {
        return yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.book.update({
                where: { id: purchase.bookId },
                data: {
                    sellStock: {
                        increment: purchase.quantity,
                    },
                },
            });
            return yield tx.purchase.delete({
                where: { id: purchaseId },
            });
        }));
    }
    return yield db_1.default.purchase.delete({
        where: { id: purchaseId },
    });
});
exports.PurchaseService = {
    createGuestPurchaseInDB,
    createMemberPurchaseInDB,
    createPOSSaleInDB,
    getAllPurchasesFromDB,
    getGuestOrdersFromDB,
    trackGuestOrderByTxnIdFromDB,
    cancelGuestPurchaseInDB,
    cancelMemberPurchaseInDB,
    updatePurchaseStatusInDB,
    deletePurchaseInDB,
};
