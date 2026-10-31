import { AuthorRole, BookType } from '@prisma/client';

export type TAuthorItem = {
  authorId?: number;
  name?: string;
  role?: AuthorRole;
};

export type TCreateBook = {
  title: string;
  slug?: string;
  author?: string;
  authors?: TAuthorItem[];
  isbn: string;
  locationCell: string;
  category?: string;
  categories?: string[];
  publisher?: string | null;
  publisherId?: number | null;
  pages?: number;
  type: BookType;
  buyPrice?: number | null;
  sellPrice?: number | null;
  discount?: number | null;
  customDiscount?: number | null;
  borrowStock?: number;
  sellStock?: number;
  coverImage?: string | null;
  images?: string[];
  description?: string | null;
  addedById?: string | null;
  donatedById?: string | null;
};

export type TUpdateBook = Partial<TCreateBook> & {
  isArchived?: boolean;
};

export type TBulkUpdateBooks = {
  bookIds: number[];
  categories?: string[];
  customDiscount?: number | null;
  locationCell?: string;
  borrowStock?: number;
  sellStock?: number;
  isArchived?: boolean;
};

export type TBulkArchiveBooks = {
  bookIds: number[];
  isArchived: boolean;
};

export type TBulkDeleteBooks = {
  bookIds: number[];
};

export type TBookFilterRequest = {
  searchTerm?: string;
  category?: string;
  author?: string;
  authorId?: number | string;
  isBorrowable?: boolean | string;
  isSellable?: boolean | string;
  type?: BookType;
  publisher?: string;
  publisherId?: number | string;
  isArchived?: boolean | string;
};
