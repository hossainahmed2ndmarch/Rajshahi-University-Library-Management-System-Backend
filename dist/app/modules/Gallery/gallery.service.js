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
exports.GalleryService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createGalleryItemIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.assetKey) {
        const existing = yield db_1.default.galleryItem.findUnique({
            where: { assetKey: payload.assetKey },
        });
        if (existing) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, `An asset with key "${payload.assetKey}" already exists!`);
        }
    }
    return yield db_1.default.galleryItem.create({
        data: {
            org: payload.org || client_1.Organization.RUIL,
            title: payload.title,
            description: payload.description,
            mediaType: payload.mediaType || client_1.MediaType.IMAGE,
            url: payload.url,
            thumbnail: payload.thumbnail,
            assetKey: payload.assetKey || null,
            category: payload.category || null,
            activityId: payload.activityId || null,
            isPublished: payload.isPublished !== undefined ? payload.isPublished : true,
            featured: payload.featured !== undefined ? payload.featured : false,
        },
        include: {
            activity: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });
});
const getAllGalleryItemsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, org, mediaType, activityId, isPublished, featured, isAsset } = query, queryParams = __rest(query, ["category", "org", "mediaType", "activityId", "isPublished", "featured", "isAsset"]);
    const galleryQuery = new queryBuilder_1.default(db_1.default.galleryItem, Object.assign({}, queryParams), {
        searchableFields: ['title', 'description', 'category', 'assetKey'],
        filterableFields: [],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    if (category && category !== 'ALL') {
        galleryQuery.where({ category: String(category) });
    }
    if (org && org !== 'ALL') {
        galleryQuery.where({ org: org });
    }
    if (mediaType && mediaType !== 'ALL') {
        galleryQuery.where({ mediaType: mediaType });
    }
    if (activityId) {
        galleryQuery.where({ activityId: Number(activityId) });
    }
    if (isPublished !== undefined && isPublished !== 'ALL') {
        const pubBool = isPublished === 'true' || isPublished === true;
        galleryQuery.where({ isPublished: pubBool });
    }
    if (featured !== undefined && featured !== 'ALL') {
        const featBool = featured === 'true' || featured === true;
        galleryQuery.where({ featured: featBool });
    }
    if (isAsset === 'true' || isAsset === true) {
        galleryQuery.where({ assetKey: { not: null } });
    }
    else if (isAsset === 'false' || isAsset === false) {
        galleryQuery.where({ assetKey: null });
    }
    galleryQuery.orderBy({ createdAt: 'desc' });
    galleryQuery.include({
        activity: {
            select: {
                id: true,
                title: true,
                slug: true,
            },
        },
    });
    return yield galleryQuery.execute();
});
const getGalleryItemByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield db_1.default.galleryItem.findUnique({
        where: { id },
        include: {
            activity: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Gallery item not found!');
    }
    return item;
});
const updateGalleryItemInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield db_1.default.galleryItem.findUnique({ where: { id } });
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Gallery item not found!');
    }
    if (payload.assetKey && payload.assetKey !== item.assetKey) {
        const existing = yield db_1.default.galleryItem.findUnique({
            where: { assetKey: payload.assetKey },
        });
        if (existing && existing.id !== id) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, `An asset with key "${payload.assetKey}" already exists!`);
        }
    }
    return yield db_1.default.galleryItem.update({
        where: { id },
        data: payload,
        include: {
            activity: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });
});
const deleteGalleryItemFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield db_1.default.galleryItem.findUnique({ where: { id } });
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Gallery item not found!');
    }
    return yield db_1.default.galleryItem.delete({ where: { id } });
});
const togglePublishInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield db_1.default.galleryItem.findUnique({ where: { id } });
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Gallery item not found!');
    }
    return yield db_1.default.galleryItem.update({
        where: { id },
        data: { isPublished: !item.isPublished },
    });
});
const toggleFeatureInDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield db_1.default.galleryItem.findUnique({ where: { id } });
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Gallery item not found!');
    }
    return yield db_1.default.galleryItem.update({
        where: { id },
        data: { featured: !item.featured },
    });
});
// ── Asset Management ────────────────────────────────────────────────────────
const getAssetByKeyFromDB = (assetKey) => __awaiter(void 0, void 0, void 0, function* () {
    const asset = yield db_1.default.galleryItem.findUnique({
        where: { assetKey },
    });
    if (!asset) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Site asset "${assetKey}" not found!`);
    }
    return asset;
});
const getAllAssetsFromDB = (org) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {
        assetKey: { not: null },
    };
    if (org && org !== client_1.Organization.BOTH) {
        where.org = { in: [org, client_1.Organization.BOTH] };
    }
    const assets = yield db_1.default.galleryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    // Return both array and a key-value dictionary for easy frontend asset resolution
    const assetMap = {};
    assets.forEach((a) => {
        if (a.assetKey) {
            assetMap[a.assetKey] = a.url;
        }
    });
    return {
        items: assets,
        assetMap,
    };
});
const upsertAssetInDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.default.galleryItem.upsert({
        where: { assetKey: payload.assetKey },
        update: {
            url: payload.url,
            title: payload.title,
            description: payload.description,
            org: payload.org || client_1.Organization.RUIL,
            category: payload.category || 'ASSET',
            mediaType: payload.mediaType || client_1.MediaType.IMAGE,
            thumbnail: payload.thumbnail,
            isPublished: true,
        },
        create: {
            assetKey: payload.assetKey,
            url: payload.url,
            title: payload.title || payload.assetKey,
            description: payload.description,
            org: payload.org || client_1.Organization.RUIL,
            category: payload.category || 'ASSET',
            mediaType: payload.mediaType || client_1.MediaType.IMAGE,
            thumbnail: payload.thumbnail,
            isPublished: true,
        },
    });
});
const getCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const records = yield db_1.default.galleryItem.findMany({
        where: {
            category: { not: null },
            assetKey: null, // Filter out internal asset keys from general gallery categories
        },
        select: { category: true },
        distinct: ['category'],
    });
    return records.map((r) => r.category).filter(Boolean);
});
exports.GalleryService = {
    createGalleryItemIntoDB,
    getAllGalleryItemsFromDB,
    getGalleryItemByIdFromDB,
    updateGalleryItemInDB,
    deleteGalleryItemFromDB,
    togglePublishInDB,
    toggleFeatureInDB,
    getAssetByKeyFromDB,
    getAllAssetsFromDB,
    upsertAssetInDB,
    getCategoriesFromDB,
};
