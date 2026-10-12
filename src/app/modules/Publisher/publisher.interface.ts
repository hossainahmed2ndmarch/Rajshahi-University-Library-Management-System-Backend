export type TCreatePublisher = {
  name: string;
  logo?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  defaultDiscount?: number;
};

export type TUpdatePublisher = Partial<TCreatePublisher>;

export type TPublisherFilterRequest = {
  searchTerm?: string;
  name?: string;
};
