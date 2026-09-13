export type TCreateArticle = {
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
