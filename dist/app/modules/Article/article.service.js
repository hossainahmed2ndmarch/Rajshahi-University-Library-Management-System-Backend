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
exports.ArticleService = exports.formatArticleResponse = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
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
const formatArticleResponse = (article) => {
    var _a, _b, _c;
    if (!article)
        return article;
    return Object.assign(Object.assign({}, article), { authorName: ((_a = article.author) === null || _a === void 0 ? void 0 : _a.name) || article.authorName || 'Contributor', authorDesignation: ((_b = article.author) === null || _b === void 0 ? void 0 : _b.authorDesignation) || article.authorDesignation || null, authorAvatar: ((_c = article.author) === null || _c === void 0 ? void 0 : _c.avatar) || null });
};
exports.formatArticleResponse = formatArticleResponse;
const createArticleIntoDB = (payload, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const baseSlug = payload.slug ? createSlug(payload.slug) : createSlug(payload.title);
    const uniqueSlug = yield ensureUniqueSlug(baseSlug);
    const readTime = payload.totalReadTime && payload.totalReadTime > 0
        ? payload.totalReadTime
        : calculateReadTime(payload.content);
    let authorId = payload.authorId || null;
    if (!authorId && payload.authorName && payload.authorName.trim()) {
        const name = payload.authorName.trim();
        let author = yield db_1.default.author.findFirst({ where: { name } });
        if (!author) {
            author = yield db_1.default.author.create({
                data: {
                    name,
                    authorDesignation: payload.authorDesignation || null,
                    bio: payload.authorBio || null,
                },
            });
        }
        authorId = author.id;
    }
    const article = yield db_1.default.article.create({
        data: {
            org: payload.org || client_1.Organization.RUIL,
            title: payload.title,
            slug: uniqueSlug,
            content: payload.content,
            coverImage: payload.coverImage || null,
            category: payload.category || 'General',
            authorId,
            authorName: payload.authorName,
            authorDesignation: payload.authorDesignation || null,
            authorBio: payload.authorBio || null,
            relatedBookId: payload.relatedBookId || null,
            totalReadTime: readTime,
            isPublished: (_a = payload.isPublished) !== null && _a !== void 0 ? _a : false,
        },
        include: {
            author: true,
            relatedBook: {
                select: {
                    id: true,
                    title: true,
                    coverImage: true,
                    isbn: true,
                },
            },
        },
    });
    return (0, exports.formatArticleResponse)(article);
});
const submitArticleIntoDB = (payload, requestingUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const baseSlug = createSlug(payload.title);
    const uniqueSlug = yield ensureUniqueSlug(baseSlug);
    const readTime = calculateReadTime(payload.content);
    let authorUser = null;
    if (requestingUserId) {
        authorUser = yield db_1.default.user.findUnique({ where: { id: requestingUserId } });
    }
    const authorName = payload.authorName || (authorUser === null || authorUser === void 0 ? void 0 : authorUser.name) || 'Guest Contributor';
    const designation = payload.authorDesignation || (payload.authorEmail ? `Email: ${payload.authorEmail}` : null);
    const article = yield db_1.default.article.create({
        data: {
            org: payload.org || client_1.Organization.RUIL,
            title: payload.title,
            slug: uniqueSlug,
            content: payload.content,
            coverImage: payload.coverImage || null,
            category: payload.category || 'General',
            authorName,
            authorDesignation: designation,
            authorBio: payload.authorBio || null,
            totalReadTime: readTime,
            isPublished: false, // Must be reviewed and approved by admin / super admin
        },
        include: {
            author: true,
        },
    });
    return (0, exports.formatArticleResponse)(article);
});
const getAllArticlesFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, isPublished, org, authorId, sortBy, sortOrder = 'desc' } = query, queryParams = __rest(query, ["category", "isPublished", "org", "authorId", "sortBy", "sortOrder"]);
    const articleQuery = new queryBuilder_1.default(db_1.default.article, queryParams, {
        searchableFields: ['title', 'content', 'authorName', 'category', 'slug'],
        filterableFields: ['category', 'isPublished', 'authorId'],
    })
        .search()
        .filter()
        .paginate()
        .fields();
    if (category && category !== 'ALL') {
        articleQuery.where({ category: String(category) });
    }
    if (isPublished !== undefined) {
        articleQuery.where({ isPublished: isPublished === 'true' || isPublished === true });
    }
    if (org && org !== 'ALL') {
        articleQuery.where({ org: org });
    }
    if (authorId) {
        articleQuery.where({ authorId: Number(authorId) });
    }
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
    articleQuery.include({
        author: true,
        relatedBook: {
            select: {
                id: true,
                title: true,
                coverImage: true,
                isbn: true,
            },
        },
    });
    const result = yield articleQuery.execute();
    return {
        meta: result.meta,
        data: result.data.map(exports.formatArticleResponse),
    };
});
const getArticleByIdOrSlugFromDB = (idOrSlug_1, ...args_1) => __awaiter(void 0, [idOrSlug_1, ...args_1], void 0, function* (idOrSlug, incrementView = false) {
    const isNumeric = !isNaN(Number(idOrSlug));
    let article;
    if (isNumeric) {
        article = yield db_1.default.article.findUnique({
            where: { id: Number(idOrSlug) },
            include: {
                author: true,
                relatedBook: {
                    select: {
                        id: true,
                        title: true,
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
                author: true,
                relatedBook: {
                    select: {
                        id: true,
                        title: true,
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
        db_1.default.article.update({
            where: { id: article.id },
            data: { totalViews: { increment: 1 } },
        }).catch(() => { });
    }
    return (0, exports.formatArticleResponse)(article);
});
const updateArticleInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existingArticle = yield db_1.default.article.findUnique({
        where: { id },
    });
    if (!existingArticle) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Article not found!');
    }
    const updateData = {};
    if (payload.org !== undefined)
        updateData.org = payload.org;
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
    if (payload.authorBio !== undefined)
        updateData.authorBio = payload.authorBio;
    if (payload.relatedBookId !== undefined)
        updateData.relatedBookId = payload.relatedBookId;
    if (payload.authorId !== undefined)
        updateData.authorId = payload.authorId;
    // When approving or publishing an article:
    // If the article does not yet have an authorId, create or find the Author in the Author table!
    if (payload.isPublished !== undefined) {
        updateData.isPublished = payload.isPublished;
        if (payload.isPublished === true) {
            const targetAuthorId = (_a = payload.authorId) !== null && _a !== void 0 ? _a : existingArticle.authorId;
            if (!targetAuthorId) {
                const name = (payload.authorName || existingArticle.authorName || '').trim();
                if (name) {
                    let author = yield db_1.default.author.findFirst({ where: { name } });
                    if (!author) {
                        author = yield db_1.default.author.create({
                            data: {
                                name,
                                authorDesignation: payload.authorDesignation || existingArticle.authorDesignation || null,
                                bio: payload.authorBio || existingArticle.authorBio || null,
                            },
                        });
                    }
                    updateData.authorId = author.id;
                }
            }
        }
    }
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
    const updated = yield db_1.default.article.update({
        where: { id },
        data: updateData,
        include: {
            author: true,
            relatedBook: {
                select: {
                    id: true,
                    title: true,
                    coverImage: true,
                    isbn: true,
                },
            },
        },
    });
    return (0, exports.formatArticleResponse)(updated);
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
    return categories.map((c) => ({
        category: c.category,
        count: c._count.id,
    }));
});
exports.ArticleService = {
    createArticleIntoDB,
    submitArticleIntoDB,
    getAllArticlesFromDB,
    getArticleByIdOrSlugFromDB,
    updateArticleInDB,
    deleteArticleFromDB,
    getArticleCategoriesFromDB,
};
