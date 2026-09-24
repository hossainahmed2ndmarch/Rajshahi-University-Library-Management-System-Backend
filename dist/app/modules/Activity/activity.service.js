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
exports.ActivityService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
/**
 * Generate a URL-safe slug from a title.
 * Appends a short timestamp suffix to guarantee uniqueness.
 */
const generateSlug = (title) => {
    const base = title
        .toLowerCase()
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/[^\w\s\u0980-\u09FF-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return `${base}-${Date.now().toString(36)}`;
};
const createActivityIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = generateSlug(payload.title);
    return yield db_1.default.activity.create({
        data: Object.assign(Object.assign({}, payload), { slug }),
    });
});
const getAllActivitiesFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, org } = query, queryParams = __rest(query, ["status", "org"]);
    const activityQuery = new queryBuilder_1.default(db_1.default.activity, Object.assign({}, queryParams), {
        searchableFields: ['title', 'category', 'description'],
        filterableFields: [],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    if (status && status !== 'ALL') {
        activityQuery.where({ status });
    }
    if (org && org !== 'ALL') {
        activityQuery.where({ org });
    }
    activityQuery.orderBy({ createdAt: 'desc' });
    // Include events count
    activityQuery.include({ _count: { select: { events: true } } });
    return yield activityQuery.execute();
});
const getActivityByIdFromDB = (idOrSlug) => __awaiter(void 0, void 0, void 0, function* () {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const where = isNumeric
        ? { id: Number(idOrSlug) }
        : { slug: idOrSlug };
    const activity = yield db_1.default.activity.findUnique({
        where,
        include: {
            _count: { select: { events: true } },
            events: {
                where: { isActive: true },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    bannerImage: true,
                    _count: { select: { sessions: true, memberRecords: true } },
                },
                orderBy: { startDate: 'desc' },
                take: 10,
            },
        },
    });
    if (!activity) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Activity not found!');
    }
    return activity;
});
const updateActivityInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const activity = yield db_1.default.activity.findUnique({ where: { id } });
    if (!activity) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Activity not found!');
    }
    return yield db_1.default.activity.update({
        where: { id },
        data: payload,
    });
});
const deleteActivityFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const activity = yield db_1.default.activity.findUnique({ where: { id } });
    if (!activity) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Activity not found!');
    }
    return yield db_1.default.activity.delete({ where: { id } });
});
const getCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const records = yield db_1.default.activity.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
    });
    return records.map((r) => r.category).filter(Boolean);
});
exports.ActivityService = {
    createActivityIntoDB,
    getAllActivitiesFromDB,
    getActivityByIdFromDB,
    updateActivityInDB,
    deleteActivityFromDB,
    getCategoriesFromDB,
};
