/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

export interface PrismaCountArgs {
  where?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
}

export interface IQueryParams {
  searchTerm?: string;
  search?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string;
  include?: string;
  [key: string]: unknown;
}

export interface IQueryConfig {
  searchableFields?: string[];
  filterableFields?: string[];
}

export interface IQueryResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}

export class QueryBuilder<
  T = any,
  TWhereInput = Record<string, unknown>,
  TInclude = Record<string, unknown>
> {
  public query: PrismaFindManyArgs;
  public countQuery: PrismaCountArgs;
  public page: number = 1;
  public limit: number = 10;
  public skip: number = 0;
  public sortBy: string = 'createdAt';
  public sortOrder: 'asc' | 'desc' = 'desc';
  public selectFields: Record<string, boolean> | undefined;

  constructor(
    private model?: PrismaModelDelegate,
    private queryParams: IQueryParams = {},
    private config: IQueryConfig = {}
  ) {
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
  public orderBy(orderByPayload: Record<string, unknown> | Array<Record<string, unknown>>): this {
    this.query.orderBy = orderByPayload;
    return this;
  }
  public search(searchableFields?: string[]): this {
    const searchTerm = (this.queryParams.searchTerm || this.queryParams.search) as string;
    const targetFields = searchableFields || this.config.searchableFields;

    if (searchTerm && targetFields && targetFields.length > 0) {
      const searchConditions: Record<string, unknown>[] = targetFields.map((field) => {
        if (field.includes('.')) {
          const parts = field.split('.');
          if (parts.length === 2) {
            const [relation, nestedField] = parts;
            return {
              [relation]: {
                [nestedField]: {
                  contains: searchTerm,
                  mode: 'insensitive' as const,
                },
              },
            };
          } else if (parts.length === 3) {
            const [relation, nestedRelation, nestedField] = parts;
            return {
              [relation]: {
                some: {
                  [nestedRelation]: {
                    [nestedField]: {
                      contains: searchTerm,
                      mode: 'insensitive' as const,
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
            mode: 'insensitive' as const,
          },
        };
      });

      const whereConditions = this.query.where as Record<string, unknown>;
      const countWhereConditions = this.countQuery.where as Record<string, unknown>;

      whereConditions.OR = searchConditions;
      countWhereConditions.OR = searchConditions;
    }

    return this;
  }

  public filter(excludeFields: string[] = ['searchTerm', 'search', 'page', 'limit', 'sortBy', 'sortOrder', 'fields', 'include']): this {
    const filterableFields = this.config.filterableFields;
    const filterParams: Record<string, unknown> = {};

    Object.keys(this.queryParams).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });

    const queryWhere = this.query.where as Record<string, unknown>;
    const countQueryWhere = this.countQuery.where as Record<string, unknown>;

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

          (queryWhere[relation] as Record<string, unknown>)[nestedField] = this.parseFilterValue(value);
          (countQueryWhere[relation] as Record<string, unknown>)[nestedField] = this.parseFilterValue(value);
          return;
        }
      }

      if (!isAllowedField) {
        return;
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        queryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
        countQueryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
        return;
      }

      queryWhere[key] = this.parseFilterValue(value);
      countQueryWhere[key] = this.parseFilterValue(value);
    });

    return this;
  }

  public sort(): this {
    const sortBy = (this.queryParams.sortBy as string) || 'createdAt';
    const sortOrder = (this.queryParams.sortOrder as string) === 'asc' ? 'asc' : 'desc';

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
    } else {
      this.query.orderBy = {
        [sortBy]: sortOrder,
      };
    }

    return this;
  }

  public paginate(): this {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;

    this.page = page;
    this.limit = limit;
    this.skip = (page - 1) * limit;

    this.query.skip = this.skip;
    this.query.take = this.limit;

    return this;
  }

  public fields(): this {
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

  public include(relation: TInclude): this {
    if (this.selectFields) {
      return this;
    }
    this.query.include = { ...(this.query.include as Record<string, unknown>), ...(relation as Record<string, unknown>) };
    return this;
  }

  public where(condition: TWhereInput): this {
    this.query.where = this.deepMerge(this.query.where as Record<string, unknown>, condition as Record<string, unknown>);
    this.countQuery.where = this.deepMerge(this.countQuery.where as Record<string, unknown>, condition as Record<string, unknown>);
    return this;
  }

  public async execute(): Promise<IQueryResult<T>> {
    if (!this.model) {
      throw new Error('Model delegate must be provided to QueryBuilder to run execute()');
    }

    const [total, data] = await Promise.all([
      this.model.count(this.countQuery),
      this.model.findMany(this.query),
    ]);

    const totalPages = Math.ceil(total / this.limit);

    return {
      data: data as T[],
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPage: totalPages,
      },
    };
  }

  public countTotal(total: number) {
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

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
          result[key] = this.deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  private parseFilterValue(value: unknown): unknown {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    if (Array.isArray(value)) {
      return { in: value.map((item) => this.parseFilterValue(item)) };
    }
    return value;
  }

  private parseRangeFilter(value: Record<string, string | number>): Record<string, unknown> {
    const rangeQuery: Record<string, unknown> = {};
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

export default QueryBuilder;
