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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createAuthorIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.author.create({
        data: {
            name: payload.name.trim(),
            avatar: payload.avatar || null,
            bio: payload.bio || null,
            authorDesignation: payload.authorDesignation || null,
            socialLinks: payload.socialLinks || undefined,
            userId: payload.userId || null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });
});
const getAllAuthorsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, name } = query, queryParams = __rest(query, ["searchTerm", "name"]);
    const authorQuery = new queryBuilder_1.default(db_1.default.author, queryParams, {
        searchableFields: ['name', 'authorDesignation', 'bio'],
        filterableFields: ['userId'],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    authorQuery
        .include({
        _count: {
            select: {
                books: true,
                articles: true,
            },
        },
        user: {
            select: {
                id: true,
                name: true,
                avatarUrl: true,
            },
        },
    })
        .orderBy({
        name: 'asc',
    });
    return yield authorQuery.execute();
});
const getAuthorByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const author = yield db_1.default.author.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            books: {
                include: {
                    book: {
                        include: {
                            publisher: true,
                        },
                    },
                },
            },
            articles: {
                where: { isPublished: true },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    category: true,
                    coverImage: true,
                    totalViews: true,
                    totalReadTime: true,
                    createdAt: true,
                },
            },
            _count: {
                select: {
                    books: true,
                    articles: true,
                },
            },
        },
    });
    if (!author) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Author not found!');
    }
    return author;
});
const updateAuthorInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.author.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Author not found!');
    }
    const updateData = {};
    if (payload.name !== undefined)
        updateData.name = payload.name.trim();
    if (payload.avatar !== undefined)
        updateData.avatar = payload.avatar;
    if (payload.bio !== undefined)
        updateData.bio = payload.bio;
    if (payload.authorDesignation !== undefined)
        updateData.authorDesignation = payload.authorDesignation;
    if (payload.socialLinks !== undefined)
        updateData.socialLinks = payload.socialLinks;
    if (payload.userId !== undefined)
        updateData.userId = payload.userId;
    return yield db_1.default.author.update({
        where: { id },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: {
                    books: true,
                    articles: true,
                },
            },
        },
    });
});
const deleteAuthorFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.author.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    books: true,
                    articles: true,
                },
            },
        },
    });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Author not found!');
    }
    return yield db_1.default.author.delete({
        where: { id },
    });
});
exports.AuthorService = {
    createAuthorIntoDB,
    getAllAuthorsFromDB,
    getAuthorByIdFromDB,
    updateAuthorInDB,
    deleteAuthorFromDB,
};
