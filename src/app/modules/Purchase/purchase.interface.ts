import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export type TPurchaseItem = {
  bookId: number;
  quantity: number;
};

export type TGuestPurchase = {
  guestName?: string;
  customerName?: string;
  guestEmail?: string;
  customerEmail?: string;
  guestPhone?: string;
  customerPhone?: string;
  address?: string;
  shippingAddress?: string;
  paymentMethod?: PaymentMethod;
  items?: TPurchaseItem[];
  bookId?: number;
  quantity?: number;
};

export type TMemberPurchase = {
  shippingAddress?: string;
  address?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  items?: TPurchaseItem[];
  bookId?: number;
  quantity?: number;
};

export type TPurchaseFilter = {
  searchTerm?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  userId?: number | string;
  transactionId?: string;
};

export type TPOSSale = {
  buyerType: 'MEMBER' | 'GUEST';
  memberId?: number;
  studentOrVoterId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  items?: TPurchaseItem[];
  bookId?: number;
  quantity?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
};
