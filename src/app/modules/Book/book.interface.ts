import { BookType } from '@prisma/client';

export type TCreateBook = {
  title: string;
  author: string;
  isbn: string;
  locationCell: string;
  category: string;
  publisher?: string;
  pages: number;
  type: BookType;
  buyPrice?: number;
  sellPrice?: number;
  discount?: number;
  borrowStock?: number;
  sellStock?: number;
  coverImage?: string;
  images?: string[];
  description?: string;
  addedById?: number;
  donatedById?: number;
};

export type TUpdateBook = Partial<TCreateBook> & {
  isArchived?: boolean;
};

export type TBookFilterRequest = {
  searchTerm?: string;
  category?: string;
  author?: string;
  isBorrowable?: boolean | string;
  isSellable?: boolean | string;
  type?: BookType;
  publisher?: string;
  isArchived?: boolean | string;
};
