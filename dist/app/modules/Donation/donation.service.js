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
exports.DonationService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createDonationInDB = (payload, donorId) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookTitle, author, category, quantity, method, isAnonymous, donorName, donorEmail, contactPhone, donorNote, pickupAddress, scheduledAt, } = payload;
    const rawContactPhone = contactPhone || payload.donorPhone || null;
    const rawDonorNote = donorNote || payload.notes || null;
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    return yield db_1.default.donation.create({
        data: {
            bookTitle: bookTitle || 'Donated Book',
            author: author || 'Unknown Author',
            category: category || 'General',
            quantity: quantity && quantity > 0 ? quantity : 1,
            method: method || 'LIBRARY_DROP_OFF',
            isAnonymous: Boolean(isAnonymous),
            donorName: isAnonymous ? 'Anonymous Donor' : (donorName || null),
            donorEmail: donorEmail || null,
            contactPhone: rawContactPhone,
            donorNote: rawDonorNote,
            pickupAddress: pickupAddress || null,
            scheduledAt: parsedScheduledAt,
            donorId: donorId || null,
            status: client_1.DonationStatus.PENDING,
        },
    });
});
const approveDonationInDB = (donationId, adminId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield db_1.default.donation.findUnique({
        where: { id: donationId },
        include: { donor: true },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation request not found!');
    }
    if (donation.status === client_1.DonationStatus.APPROVED || donation.status === client_1.DonationStatus.RECEIVED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This donation has already been received/approved!');
    }
    // Atomic transaction to ensure book is created/updated and donation status is marked APPROVED/RECEIVED
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let bookId = donation.catalogedBookId;
        if (bookId) {
            // If already linked, increment borrow stock
            const quantityToAdd = (_a = payload === null || payload === void 0 ? void 0 : payload.borrowStock) !== null && _a !== void 0 ? _a : (donation.quantity || 1);
            yield tx.book.update({
                where: { id: bookId },
                data: Object.assign(Object.assign({ borrowStock: { increment: quantityToAdd } }, ((payload === null || payload === void 0 ? void 0 : payload.sellStock) ? { sellStock: { increment: payload.sellStock } } : {})), ((payload === null || payload === void 0 ? void 0 : payload.locationCell) ? { locationCell: payload.locationCell } : {})),
            });
        }
        else {
            // Check if book with matching ISBN or title+author or title already exists in library catalog
            let existingBook = null;
            if ((_b = payload === null || payload === void 0 ? void 0 : payload.isbn) === null || _b === void 0 ? void 0 : _b.trim()) {
                existingBook = yield tx.book.findUnique({
                    where: { isbn: payload.isbn.trim() },
                });
            }
            const trimmedTitle = (_c = donation.bookTitle) === null || _c === void 0 ? void 0 : _c.trim();
            const trimmedAuthor = (_d = donation.author) === null || _d === void 0 ? void 0 : _d.trim();
            if (!existingBook && trimmedTitle && trimmedTitle.toLowerCase() !== 'donated book') {
                if (trimmedAuthor && trimmedAuthor.toLowerCase() !== 'unknown author') {
                    existingBook = yield tx.book.findFirst({
                        where: {
                            title: { equals: trimmedTitle, mode: 'insensitive' },
                            author: { equals: trimmedAuthor, mode: 'insensitive' },
                        },
                    });
                }
                if (!existingBook) {
                    existingBook = yield tx.book.findFirst({
                        where: {
                            title: { equals: trimmedTitle, mode: 'insensitive' },
                        },
                    });
                }
            }
            if (existingBook) {
                bookId = existingBook.id;
                const quantityToAdd = (_e = payload === null || payload === void 0 ? void 0 : payload.borrowStock) !== null && _e !== void 0 ? _e : (donation.quantity || 1);
                yield tx.book.update({
                    where: { id: existingBook.id },
                    data: Object.assign(Object.assign({ borrowStock: { increment: quantityToAdd } }, ((payload === null || payload === void 0 ? void 0 : payload.sellStock) ? { sellStock: { increment: payload.sellStock } } : {})), ((payload === null || payload === void 0 ? void 0 : payload.locationCell) ? { locationCell: payload.locationCell } : {})),
                });
            }
            else {
                // Automatically add to books as borrowable (BORROW_ONLY)
                const generatedIsbn = ((_f = payload === null || payload === void 0 ? void 0 : payload.isbn) === null || _f === void 0 ? void 0 : _f.trim()) || `DON-${donation.id}-${Date.now().toString().slice(-6)}`;
                const initialPages = (payload === null || payload === void 0 ? void 0 : payload.pages) || 150;
                const initialLocation = (payload === null || payload === void 0 ? void 0 : payload.locationCell) || 'DONATION-DESK';
                const assignedCat = (payload === null || payload === void 0 ? void 0 : payload.assignedCategory) || donation.category || 'General';
                const newBook = yield tx.book.create({
                    data: {
                        title: donation.bookTitle || 'Donated Book',
                        author: donation.author || 'Unknown Author',
                        isbn: generatedIsbn,
                        locationCell: initialLocation,
                        category: assignedCat,
                        pages: initialPages,
                        type: client_1.BookType.BORROW_ONLY,
                        sellPrice: null,
                        borrowStock: (_g = payload === null || payload === void 0 ? void 0 : payload.borrowStock) !== null && _g !== void 0 ? _g : (donation.quantity || 1),
                        sellStock: (_h = payload === null || payload === void 0 ? void 0 : payload.sellStock) !== null && _h !== void 0 ? _h : 0,
                        description: donation.donorNote ||
                            'Donated book added into library catalog collection as borrowable. Further details can be updated by admin/shifter.',
                        addedById: adminId,
                        donatedById: donation.donorId || null,
                    },
                });
                bookId = newBook.id;
            }
        }
        // Update donation status to APPROVED (or RECEIVED) and link catalogedBookId
        const updatedDonation = yield tx.donation.update({
            where: { id: donationId },
            data: {
                status: client_1.DonationStatus.APPROVED,
                catalogedBookId: bookId,
                receivedById: adminId,
                receivedAt: new Date(),
            },
            include: {
                catalogedBook: true,
                donor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                receivedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
        return updatedDonation;
    }));
    return result;
});
const rejectDonationInDB = (donationId) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield db_1.default.donation.findUnique({
        where: { id: donationId },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation request not found!');
    }
    if (donation.status === client_1.DonationStatus.REJECTED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Donation has already been rejected!');
    }
    return yield db_1.default.donation.update({
        where: { id: donationId },
        data: { status: client_1.DonationStatus.REJECTED },
    });
});
const convertDonationToStock = (donationId, payload, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const donation = yield db_1.default.donation.findUnique({
        where: { id: donationId },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation request not found!');
    }
    if (donation.status === client_1.DonationStatus.CATALOGED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'This donation has already been converted into catalog stock!');
    }
    // Check if book with matching ISBN or title+author already exists
    let existingBook = null;
    if ((_a = payload.isbn) === null || _a === void 0 ? void 0 : _a.trim()) {
        existingBook = yield db_1.default.book.findUnique({
            where: { isbn: payload.isbn.trim() },
        });
    }
    const trimmedTitle = (_b = donation.bookTitle) === null || _b === void 0 ? void 0 : _b.trim();
    const trimmedAuthor = (_c = donation.author) === null || _c === void 0 ? void 0 : _c.trim();
    if (!existingBook && trimmedTitle && trimmedTitle.toLowerCase() !== 'donated book') {
        if (trimmedAuthor && trimmedAuthor.toLowerCase() !== 'unknown author') {
            existingBook = yield db_1.default.book.findFirst({
                where: {
                    title: { equals: trimmedTitle, mode: 'insensitive' },
                    author: { equals: trimmedAuthor, mode: 'insensitive' },
                },
            });
        }
        if (!existingBook) {
            existingBook = yield db_1.default.book.findFirst({
                where: {
                    title: { equals: trimmedTitle, mode: 'insensitive' },
                },
            });
        }
    }
    // Atomic transaction to create or update Book entry and mark Donation as CATALOGED
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let bookId;
        if (existingBook) {
            bookId = existingBook.id;
            const addBorrow = (_a = payload.borrowStock) !== null && _a !== void 0 ? _a : (payload.type !== 'SELL_ONLY' ? donation.quantity : 0);
            const addSell = (_b = payload.sellStock) !== null && _b !== void 0 ? _b : (payload.type !== 'BORROW_ONLY' ? donation.quantity : 0);
            yield tx.book.update({
                where: { id: existingBook.id },
                data: Object.assign(Object.assign({ borrowStock: { increment: addBorrow }, sellStock: { increment: addSell } }, (payload.locationCell ? { locationCell: payload.locationCell } : {})), (payload.sellPrice ? { sellPrice: payload.sellPrice } : {})),
            });
        }
        else {
            const book = yield tx.book.create({
                data: {
                    title: donation.bookTitle || 'Donated Book',
                    author: donation.author || 'Unknown Author',
                    isbn: payload.isbn,
                    locationCell: payload.locationCell,
                    category: donation.category || 'General',
                    pages: payload.pages,
                    type: payload.type,
                    sellPrice: payload.sellPrice || null,
                    borrowStock: (_c = payload.borrowStock) !== null && _c !== void 0 ? _c : (payload.type !== 'SELL_ONLY' ? donation.quantity : 0),
                    sellStock: (_d = payload.sellStock) !== null && _d !== void 0 ? _d : (payload.type !== 'BORROW_ONLY' ? donation.quantity : 0),
                    coverImage: payload.coverImage || null,
                    description: payload.description || donation.donorNote || null,
                    addedById: adminId,
                    donatedById: donation.donorId || null,
                },
            });
            bookId = book.id;
        }
        const updatedDonation = yield tx.donation.update({
            where: { id: donationId },
            data: {
                status: client_1.DonationStatus.CATALOGED,
                catalogedBookId: bookId,
                receivedById: adminId,
                receivedAt: donation.receivedAt || new Date(),
            },
            include: {
                catalogedBook: true,
            },
        });
        return updatedDonation;
    }));
    return result;
});
const getAllDonationsFromDB = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = Object.assign({}, query);
    queryParams.limit = queryParams.limit ? Number(queryParams.limit) : 100;
    const donationQuery = new queryBuilder_1.default(db_1.default.donation, queryParams, {
        searchableFields: ['bookTitle', 'author', 'category', 'donorName', 'donorEmail', 'contactPhone'],
        filterableFields: ['status', 'method', 'isAnonymous', 'donorId'],
    })
        .search()
        .filter()
        .sort()
        .paginate()
        .include({
        donor: {
            select: {
                id: true,
                name: true,
                email: true,
            },
        },
        receivedBy: {
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        },
        catalogedBook: true,
    });
    if (user && user.role === client_1.UserRole.MEMBER) {
        donationQuery.where({
            OR: [
                { donorId: user.userId },
                ...(user.email
                    ? [
                        {
                            donorEmail: {
                                equals: user.email,
                                mode: 'insensitive',
                            },
                        },
                    ]
                    : []),
            ],
        });
    }
    return yield donationQuery.execute();
});
const createPOSDonationInDB = (payload, shifterId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const donorType = payload.donorType || 'GUEST';
    let donorId = null;
    let finalDonorName = ((_a = payload.donorName) === null || _a === void 0 ? void 0 : _a.trim()) || 'Walk-in Donor';
    let finalDonorEmail = ((_b = payload.donorEmail) === null || _b === void 0 ? void 0 : _b.trim()) || null;
    let finalContactPhone = ((_c = payload.contactPhone) === null || _c === void 0 ? void 0 : _c.trim()) || null;
    if (donorType === 'MEMBER' && payload.memberId) {
        const member = yield db_1.default.user.findUnique({
            where: { id: Number(payload.memberId) },
        });
        if (member) {
            donorId = member.id;
            finalDonorName = member.name;
            finalDonorEmail = member.email;
            finalContactPhone = member.phone || null;
        }
    }
    if (payload.isAnonymous) {
        finalDonorName = 'Anonymous Donor';
    }
    const quantity = payload.quantity && Number(payload.quantity) > 0 ? Number(payload.quantity) : 1;
    const bookTitle = payload.bookTitle.trim();
    const author = ((_d = payload.author) === null || _d === void 0 ? void 0 : _d.trim()) || 'Unknown Author';
    const category = ((_e = payload.category) === null || _e === void 0 ? void 0 : _e.trim()) || 'General';
    const autoCatalog = payload.autoCatalog !== false;
    const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        let catalogedBookId = null;
        let donationStatus = client_1.DonationStatus.RECEIVED;
        if (autoCatalog) {
            // Check if book already exists in catalog
            let existingBook = null;
            if ((_a = payload.isbn) === null || _a === void 0 ? void 0 : _a.trim()) {
                existingBook = yield tx.book.findUnique({
                    where: { isbn: payload.isbn.trim() },
                });
            }
            if (!existingBook && bookTitle && bookTitle.toLowerCase() !== 'donated book') {
                if (author && author.toLowerCase() !== 'unknown author') {
                    existingBook = yield tx.book.findFirst({
                        where: {
                            title: { equals: bookTitle, mode: 'insensitive' },
                            author: { equals: author, mode: 'insensitive' },
                        },
                    });
                }
                if (!existingBook) {
                    existingBook = yield tx.book.findFirst({
                        where: {
                            title: { equals: bookTitle, mode: 'insensitive' },
                        },
                    });
                }
            }
            if (existingBook) {
                catalogedBookId = existingBook.id;
                yield tx.book.update({
                    where: { id: existingBook.id },
                    data: Object.assign({ borrowStock: { increment: quantity } }, (((_b = payload.locationCell) === null || _b === void 0 ? void 0 : _b.trim()) ? { locationCell: payload.locationCell.trim() } : {})),
                });
            }
            else {
                const generatedIsbn = ((_c = payload.isbn) === null || _c === void 0 ? void 0 : _c.trim()) || `DON-POS-${Date.now().toString().slice(-6)}`;
                const initialPages = payload.pages || 150;
                const initialLocation = ((_d = payload.locationCell) === null || _d === void 0 ? void 0 : _d.trim()) || 'DONATION-DESK';
                const newBook = yield tx.book.create({
                    data: {
                        title: bookTitle,
                        author,
                        isbn: generatedIsbn,
                        locationCell: initialLocation,
                        category,
                        pages: initialPages,
                        type: client_1.BookType.BORROW_ONLY,
                        sellPrice: null,
                        borrowStock: quantity,
                        sellStock: 0,
                        description: payload.donorNote ||
                            `In-person donation received at POS Desk by staff. Condition: ${payload.condition || 'GOOD'}.`,
                        addedById: shifterId,
                        donatedById: donorId,
                    },
                });
                catalogedBookId = newBook.id;
            }
            donationStatus = client_1.DonationStatus.APPROVED;
        }
        const donation = yield tx.donation.create({
            data: {
                bookTitle,
                author,
                category,
                quantity,
                method: 'LIBRARY_DROP_OFF',
                isAnonymous: Boolean(payload.isAnonymous),
                donorName: finalDonorName,
                donorEmail: finalDonorEmail,
                contactPhone: finalContactPhone,
                donorNote: payload.donorNote || (payload.condition ? `Condition: ${payload.condition}` : null),
                donorId,
                receivedById: shifterId,
                receivedAt: new Date(),
                status: donationStatus,
                catalogedBookId,
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        studentOrVoterId: true,
                    },
                },
                receivedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                catalogedBook: true,
            },
        });
        return donation;
    }));
    return result;
});
const deleteDonationInDB = (donationId) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield db_1.default.donation.findUnique({
        where: { id: donationId },
    });
    if (!donation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Donation record not found!');
    }
    return yield db_1.default.donation.delete({
        where: { id: donationId },
    });
});
exports.DonationService = {
    createDonationInDB,
    createPOSDonationInDB,
    approveDonationInDB,
    rejectDonationInDB,
    convertDonationToStock,
    getAllDonationsFromDB,
    deleteDonationInDB,
};
