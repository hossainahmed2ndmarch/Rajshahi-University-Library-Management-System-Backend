export type TCreateAuthor = {
  name: string;
  avatar?: string | null;
  bio?: string | null;
  authorDesignation?: string | null;
  socialLinks?: Record<string, string> | null;
  userId?: number | null;
};

export type TUpdateAuthor = Partial<TCreateAuthor>;

export type TAuthorFilterRequest = {
  searchTerm?: string;
  name?: string;
  authorDesignation?: string;
};
