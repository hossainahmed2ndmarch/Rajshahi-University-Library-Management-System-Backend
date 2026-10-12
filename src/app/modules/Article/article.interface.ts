import { Organization } from '@prisma/client';

export type TCreateArticle = {
  org?: Organization;
  title: string;
  slug?: string;
  content: string;
  coverImage?: string | null;
  category: string;
  authorId?: number | null;
  authorName?: string;
  authorDesignation?: string | null;
  authorBio?: string | null;
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
  authorBio?: string | null;
  authorEmail?: string | null;
  coverImage?: string | null;
};
