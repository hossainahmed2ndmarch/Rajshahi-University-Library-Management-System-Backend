import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface TInitiateDonationPayload {
  eventId?: number | null;
  amount: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  donorNote?: string;
}

export interface TCreateManualDonationPayload {
  eventId?: number | null;
  userId?: number | null;
  amount: number;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  donorNote?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  receiptNo?: string;
  paidAt?: Date | string;
}

export interface TUpdateDonationPayload {
  eventId?: number | null;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  donorNote?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  receiptNo?: string;
}
