"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor(model, queryParams = {}, config = {}) {
        this.model = model;
        this.queryParams = queryParams;
        this.config = config;
        this.page = 1;
        this.limit = 10;
        this.skip = 0;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.query = {
            where: {},
            include: {},
            orderBy: {},
            skip: 0,
            take: 10,
        };
        this.countQuery = {
            where: {},
        };
    }
    // Add this inside QueryBuilder class in QueryBuilder.ts
    orderBy(orderByPayload) {
        this.query.orderBy = orderByPayload;
        return this;
    }
    search(searchableFields) {
        const searchTerm = (this.queryParams.searchTerm || this.queryParams.search);
        const targetFields = searchableFields || this.config.searchableFields;
        if (searchTerm && targetFields && targetFields.length > 0) {
            const searchConditions = targetFields.map((field) => {
                if (field.includes('.')) {
                    const parts = field.split('.');
                    if (parts.length === 2) {
                        const [relation, nestedField] = parts;
                        return {
                            [relation]: {
                                [nestedField]: {
                                    contains: searchTerm,
                                    mode: 'insensitive',
                                },
                            },
                        };
                    }
                    else if (parts.length === 3) {
                        const [relation, nestedRelation, nestedField] = parts;
                        return {
                            [relation]: {
                                some: {
                                    [nestedRelation]: {
                                        [nestedField]: {
                                            contains: searchTerm,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            },
                        };
                    }
                }
                return {
                    [field]: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                };
            });
            const whereConditions = this.query.where;
            const countWhereConditions = this.countQuery.where;
            whereConditions.OR = searchConditions;
            countWhereConditions.OR = searchConditions;
        }
        return this;
    }
    filter(excludeFields = ['searchTerm', 'search', 'page', 'limit', 'sortBy', 'sortOrder', 'fields', 'include']) {
        const filterableFields = this.config.filterableFields;
        const filterParams = {};
        Object.keys(this.queryParams).forEach((key) => {
            if (!excludeFields.includes(key)) {
                filterParams[key] = this.queryParams[key];
            }
        });
        const queryWhere = this.query.where;
        const countQueryWhere = this.countQuery.where;
        Object.keys(filterParams).forEach((key) => {
            const value = filterParams[key];
            if (value === undefined || value === '' || value === null) {
                return;
            }
            const isAllowedField = !filterableFields || filterableFields.length === 0 || filterableFields.includes(key);
            if (key.includes('.')) {
                const parts = key.split('.');
                if (filterableFields && !filterableFields.includes(key)) {
                    return;
                }
                if (parts.length === 2) {
                    const [relation, nestedField] = parts;
                    if (!queryWhere[relation]) {
                        queryWhere[relation] = {};
                        countQueryWhere[relation] = {};
                    }
                    queryWhere[relation][nestedField] = this.parseFilterValue(value);
                    countQueryWhere[relation][nestedField] = this.parseFilterValue(value);
                    return;
                }
            }
            if (!isAllowedField) {
                return;
            }
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                queryWhere[key] = this.parseRangeFilter(value);
                countQueryWhere[key] = this.parseRangeFilter(value);
                return;
            }
            queryWhere[key] = this.parseFilterValue(value);
            countQueryWhere[key] = this.parseFilterValue(value);
        });
        return this;
    }
    sort() {
        const sortBy = this.queryParams.sortBy || 'createdAt';
        const sortOrder = this.queryParams.sortOrder === 'asc' ? 'asc' : 'desc';
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        if (sortBy.includes('.')) {
            const parts = sortBy.split('.');
            if (parts.length === 2) {
                const [relation, nestedField] = parts;
                this.query.orderBy = {
                    [relation]: {
                        [nestedField]: sortOrder,
                    },
                };
            }
        }
        else {
            this.query.orderBy = {
                [sortBy]: sortOrder,
            };
        }
        return this;
    }
    paginate() {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || 10;
        this.page = page;
        this.limit = limit;
        this.skip = (page - 1) * limit;
        this.query.skip = this.skip;
        this.query.take = this.limit;
        return this;
    }
    fields() {
        const fieldsParam = this.queryParams.fields;
        if (fieldsParam && typeof fieldsParam === 'string') {
            const fieldsArray = fieldsParam.split(',').map((field) => field.trim());
            this.selectFields = {};
            fieldsArray.forEach((field) => {
                if (this.selectFields && field) {
                    this.selectFields[field] = true;
                }
            });
            this.query.select = this.selectFields;
            delete this.query.include;
        }
        return this;
    }
    include(relation) {
        if (this.selectFields) {
            return this;
        }
        this.query.include = Object.assign(Object.assign({}, this.query.include), relation);
        return this;
    }
    where(condition) {
        this.query.where = this.deepMerge(this.query.where, condition);
        this.countQuery.where = this.deepMerge(this.countQuery.where, condition);
        return this;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.model) {
                throw new Error('Model delegate must be provided to QueryBuilder to run execute()');
            }
            const [total, data] = yield Promise.all([
                this.model.count(this.countQuery),
                this.model.findMany(this.query),
            ]);
            const totalPages = Math.ceil(total / this.limit);
            return {
                data: data,
                meta: {
                    page: this.page,
                    limit: this.limit,
                    total,
                    totalPage: totalPages,
                },
            };
        });
    }
    countTotal(total) {
        const page = this.page;
        const limit = this.limit;
        const totalPage = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPage,
        };
    }
    deepMerge(target, source) {
        const result = Object.assign({}, target);
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    parseFilterValue(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
            return Number(value);
        }
        if (Array.isArray(value)) {
            return { in: value.map((item) => this.parseFilterValue(item)) };
        }
        return value;
    }
    parseRangeFilter(value) {
        const rangeQuery = {};
        Object.keys(value).forEach((operator) => {
            const operatorValue = value[operator];
            const parsedValue = typeof operatorValue === 'string' && !isNaN(Number(operatorValue)) ? Number(operatorValue) : operatorValue;
            switch (operator) {
                case 'lt':
                case 'lte':
                case 'gt':
                case 'gte':
                case 'equals':
                case 'not':
                case 'contains':
                case 'startsWith':
                case 'endsWith':
                    rangeQuery[operator] = parsedValue;
                    break;
                case 'in':
                case 'notIn':
                    rangeQuery[operator] = Array.isArray(operatorValue) ? operatorValue : [parsedValue];
                    break;
                default:
                    break;
            }
        });
        return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
    }
}
exports.QueryBuilder = QueryBuilder;
exports.default = QueryBuilder;
