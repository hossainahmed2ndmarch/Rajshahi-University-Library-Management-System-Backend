import { Organization, MediaType } from '@prisma/client';

export type TCreateGalleryItem = {
  org?: Organization;
  title?: string;
  description?: string;
  mediaType?: MediaType;
  url: string;
  thumbnail?: string;
  assetKey?: string;
  category?: string;
  activityId?: number;
  isPublished?: boolean;
  featured?: boolean;
};

export type TUpdateGalleryItem = Partial<TCreateGalleryItem>;

export type TSetAssetPayload = {
  assetKey: string;
  url: string;
  title?: string;
  description?: string;
  org?: Organization;
  category?: string;
  mediaType?: MediaType;
  thumbnail?: string;
  activityId?: number | null;
};
