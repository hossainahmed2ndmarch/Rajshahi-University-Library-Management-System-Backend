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
exports.ArticleService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const db_1 = __importDefault(require("../../../lib/db"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const calculateReadTime = (content) => {
    if (!content)
        return 1;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
};
const createSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
const ensureUniqueSlug = (baseSlug, currentArticleId) => __awaiter(void 0, void 0, void 0, function* () {
    let slug = baseSlug || 'article';
    let counter = 1;
    while (true) {
        const existing = yield db_1.default.article.findUnique({
            where: { slug },
        });
        if (!existing || (currentArticleId && existing.id === currentArticleId)) {
            return slug;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
});
const createArticleIntoDB = (payload, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const baseSlug = payload.slug ? createSlug(payload.slug) : createSlug(payload.title);
    const uniqueSlug = yield ensureUniqueSlug(baseSlug);
    const readTime = payload.totalReadTime && payload.totalReadTime > 0
        ? payload.totalReadTime
        : calculateReadTime(payload.content);
    const authorUserId = (_b = (_a = payload.authorUserId) !== null && _a !== void 0 ? _a : requestingUserId) !== null && _b !== void 0 ? _b : null;
    return yield db_1.default.article.create({
        data: {
            title: payload.title,
            slug: uniqueSlug,
            content: payload.content,
            coverImage: payload.coverImage || null,
            category: payload.category || 'General',
            authorUserId: authorUserId,
            authorName: payload.authorName,
            authorDesignation: payload.authorDesignation || null,
            relatedBookId: payload.relatedBookId || null,
            totalReadTime: readTime,
            isPublished: (_c = payload.isPublished) !== null && _c !== void 0 ? _c : false,
        },
        include: {
            authorUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            relatedBook: {
                select: {
                    id: true,
                    title: true,
                    author: true,
                    coverImage: true,
                    isbn: true,
                },
            },
        },
    });
});
const getAllArticlesFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, isPublished, sortBy, sortOrder = 'desc' } = query, queryParams = __rest(query, ["category", "isPublished", "sortBy", "sortOrder"]);
    const articleQuery = new queryBuilder_1.default(db_1.default.article, queryParams, {
        searchableFields: ['title', 'content', 'authorName', 'category', 'slug'],
        filterableFields: ['category', 'isPublished', 'authorUserId'],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    if (category && typeof category === 'string' && category !== 'ALL') {
        articleQuery.where({
            category: { equals: category.trim(), mode: 'insensitive' },
        });
    }
    if (isPublished !== undefined) {
        const publishedBool = isPublished === 'true' || isPublished === true;
        articleQuery.where({
            isPublished: publishedBool,
        });
    }
    // Include relations
    articleQuery.include({
        authorUser: {
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        },
        relatedBook: {
            select: {
                id: true,
                title: true,
                author: true,
                coverImage: true,
                isbn: true,
            },
        },
    });
    if (sortBy) {
        articleQuery.orderBy({
            [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        });
    }
    else {
        articleQuery.orderBy({
            createdAt: 'desc',
        });
    }
    return yield articleQuery.execute();
});
const getArticleByIdOrSlugFromDB = (idOrSlug_1, ...args_1) => __awaiter(void 0, [idOrSlug_1, ...args_1], void 0, function* (idOrSlug, incrementView = true) {
    const isNumeric = typeof idOrSlug === 'number' || (!isNaN(Number(idOrSlug)) && !isNaN(parseFloat(String(idOrSlug))));
    let article;
    if (isNumeric) {
        article = yield db_1.default.article.findFirst({
            where: {
                OR: [
                    { id: Number(idOrSlug) },
                    { slug: String(idOrSlug) },
                ],
            },
            include: {
                authorUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                relatedBook: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        coverImage: true,
                        isbn: true,
                    },
                },
            },
        });
    }
    else {
        article = yield db_1.default.article.findUnique({
            where: { slug: String(idOrSlug) },
            include: {
                authorUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                relatedBook: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        coverImage: true,
                        isbn: true,
                    },
                },
            },
        });
    }
    if (!article) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Article not found!');
    }
    if (incrementView) {
        // Increment view count asynchronously in background
        db_1.default.article.update({
            where: { id: article.id },
            data: { totalViews: { increment: 1 } },
        }).catch(() => { });
    }
    return article;
});
const updateArticleInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingArticle = yield db_1.default.article.findUnique({
        where: { id },
    });
    if (!existingArticle) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Article not found!');
    }
    const updateData = {};
    if (payload.title !== undefined)
        updateData.title = payload.title;
    if (payload.content !== undefined)
        updateData.content = payload.content;
    if (payload.coverImage !== undefined)
        updateData.coverImage = payload.coverImage;
    if (payload.category !== undefined)
        updateData.category = payload.category;
    if (payload.authorName !== undefined)
        updateData.authorName = payload.authorName;
    if (payload.authorDesignation !== undefined)
        updateData.authorDesignation = payload.authorDesignation;
    if (payload.authorUserId !== undefined)
        updateData.authorUserId = payload.authorUserId;
    if (payload.relatedBookId !== undefined)
        updateData.relatedBookId = payload.relatedBookId;
    if (payload.isPublished !== undefined)
        updateData.isPublished = payload.isPublished;
    if (payload.slug && payload.slug !== existingArticle.slug) {
        const slugBase = createSlug(payload.slug);
        updateData.slug = yield ensureUniqueSlug(slugBase, id);
    }
    else if (payload.title && !existingArticle.slug) {
        updateData.slug = yield ensureUniqueSlug(createSlug(payload.title), id);
    }
    if (payload.totalReadTime !== undefined) {
        updateData.totalReadTime = payload.totalReadTime;
    }
    else if (payload.content) {
        updateData.totalReadTime = calculateReadTime(payload.content);
    }
    return yield db_1.default.article.update({
        where: { id },
        data: updateData,
        include: {
            authorUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            relatedBook: {
                select: {
                    id: true,
                    title: true,
                    author: true,
                    coverImage: true,
                    isbn: true,
                },
            },
        },
    });
});
const deleteArticleFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingArticle = yield db_1.default.article.findUnique({
        where: { id },
    });
    if (!existingArticle) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Article not found!');
    }
    return yield db_1.default.article.delete({
        where: { id },
    });
});
const getArticleCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield db_1.default.article.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: {
            id: true,
        },
        orderBy: {
            _count: {
                id: 'desc',
            },
        },
    });
    const defaultCategories = [
        'Monthly Newspaper',
        'Scholarly Article',
        'Library Notice',
        'Manuscript Review',
        'Islamic Research',
        'Book Excerpt',
    ];
    const map = new Map();
    defaultCategories.forEach((cat) => map.set(cat, 0));
    categories.forEach((c) => {
        if (c.category) {
            map.set(c.category, c._count.id);
        }
    });
    return Array.from(map.entries()).map(([category, count]) => ({
        category,
        count,
    }));
});
exports.ArticleService = {
    createArticleIntoDB,
    getAllArticlesFromDB,
    getArticleByIdOrSlugFromDB,
    updateArticleInDB,
    deleteArticleFromDB,
    getArticleCategoriesFromDB,
};
