import { Organization } from '@prisma/client';

export type TCreateArticle = {
  org?: Organization;
  title: string;
  slug?: string;
  content: string;
  coverImage?: string | null;
  category: string;
  authorUserId?: number | null;
  authorName: string;
  authorDesignation?: string | null;
  relatedBookId?: number | null;
  totalReadTime?: number;
  isPublished?: boolean;
};

export type TUpdateArticle = Partial<TCreateArticle>;

export type TSubmitArticle = {
  org?: Organization;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorDesignation?: string | null;
  authorEmail?: string | null;
  coverImage?: string | null;
};
