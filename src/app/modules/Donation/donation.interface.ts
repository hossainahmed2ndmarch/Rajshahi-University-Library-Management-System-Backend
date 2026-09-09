import { DonationMethod, DonationStatus } from '@prisma/client';

export type TGuestDonation = {
  donorName?: string;
  donorEmail?: string;
  contactPhone?: string;
  method?: DonationMethod;
  isAnonymous?: boolean;
  donorNote?: string;
  bookTitle: string;
  author: string;
  category: string;
  quantity?: number;
  pickupAddress?: string;
  scheduledAt?: string | Date;
};

export type TMemberDonation = {
  donorId?: number;
  method?: DonationMethod;
  isAnonymous?: boolean;
  donorNote?: string;
  bookTitle: string;
  author: string;
  category: string;
  quantity?: number;
  pickupAddress?: string;
  scheduledAt?: string | Date;
};

export type TApproveDonationPayload = {
  locationCell?: string;
  assignedCategory?: string;
  pages?: number;
  isbn?: string;
  borrowStock?: number;
  sellStock?: number;
};

export type TConvertDonationToStock = {
  isbn: string;
  locationCell: string;
  pages: number;
  type: 'BORROW_ONLY' | 'SELL_ONLY' | 'HYBRID';
  sellPrice?: number;
  borrowStock?: number;
  sellStock?: number;
  coverImage?: string;
  description?: string;
};

export type TDonationFilterRequest = {
  status?: DonationStatus;
  method?: DonationMethod;
  searchTerm?: string;
};
