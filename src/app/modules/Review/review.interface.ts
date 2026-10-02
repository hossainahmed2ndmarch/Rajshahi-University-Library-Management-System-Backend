import { Organization } from '@prisma/client';

export type TCreateBookReview = {
  bookId: number;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  isAnonymous?: boolean;
};

export type TCreateServiceReview = {
  org?: Organization;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
  reviewerName?: string;
  reviewerEmail?: string;
};
