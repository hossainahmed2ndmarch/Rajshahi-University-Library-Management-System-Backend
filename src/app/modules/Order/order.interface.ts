import { DeliveryMethod, MFSProvider, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export type TOrderItemInput = {
  bookId: number;
  quantity: number;
};

export type TCreateOrderInput = {
  // Optional if registered user
  userId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;

  items: TOrderItemInput[];

  deliveryMethod?: DeliveryMethod;
  deliveryCharge?: number;

  couponCode?: string;

  paymentMethod?: PaymentMethod;
  mfsProvider?: MFSProvider;
  senderPhone?: string;
  customerTrxId?: string;

  // POS Metadata
  isPOSSale?: boolean;
  posNotes?: string;
};

export type TUpdateOrderStatusInput = {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

export type TVerifyOrderPaymentInput = {
  isApproved: boolean;
  notes?: string;
};

export type TDispatchCourierInput = {
  courierName?: string;
  note?: string;
};
