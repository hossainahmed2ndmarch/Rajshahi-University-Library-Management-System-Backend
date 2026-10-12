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
exports.PublisherService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createPublisherIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.publisher.findUnique({
        where: { name: payload.name.trim() },
    });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A publisher with this name already exists!');
    }
    return yield db_1.default.publisher.create({
        data: {
            name: payload.name.trim(),
            logo: payload.logo || null,
            description: payload.description || null,
            websiteUrl: payload.websiteUrl || null,
            defaultDiscount: payload.defaultDiscount !== undefined ? payload.defaultDiscount : 0,
        },
    });
});
const getAllPublishersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, name } = query, queryParams = __rest(query, ["searchTerm", "name"]);
    const publisherQuery = new queryBuilder_1.default(db_1.default.publisher, queryParams, {
        searchableFields: ['name', 'description'],
        filterableFields: [],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    publisherQuery
        .include({
        _count: {
            select: {
                books: true,
            },
        },
    })
        .orderBy({
        name: 'asc',
    });
    return yield publisherQuery.execute();
});
const getPublisherByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const publisher = yield db_1.default.publisher.findUnique({
        where: { id },
        include: {
            books: {
                include: {
                    authors: {
                        include: {
                            author: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    books: true,
                },
            },
        },
    });
    if (!publisher) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Publisher not found!');
    }
    return publisher;
});
const updatePublisherInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.publisher.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Publisher not found!');
    }
    if (payload.name && payload.name.trim() !== existing.name) {
        const duplicate = yield db_1.default.publisher.findUnique({
            where: { name: payload.name.trim() },
        });
        if (duplicate) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A publisher with this name already exists!');
        }
    }
    const updateData = {};
    if (payload.name !== undefined)
        updateData.name = payload.name.trim();
    if (payload.logo !== undefined)
        updateData.logo = payload.logo;
    if (payload.description !== undefined)
        updateData.description = payload.description;
    if (payload.websiteUrl !== undefined)
        updateData.websiteUrl = payload.websiteUrl;
    if (payload.defaultDiscount !== undefined)
        updateData.defaultDiscount = payload.defaultDiscount;
    return yield db_1.default.publisher.update({
        where: { id },
        data: updateData,
        include: {
            _count: {
                select: {
                    books: true,
                },
            },
        },
    });
});
const deletePublisherFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.publisher.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Publisher not found!');
    }
    return yield db_1.default.publisher.delete({
        where: { id },
    });
});
exports.PublisherService = {
    createPublisherIntoDB,
    getAllPublishersFromDB,
    getPublisherByIdFromDB,
    updatePublisherInDB,
    deletePublisherFromDB,
};
