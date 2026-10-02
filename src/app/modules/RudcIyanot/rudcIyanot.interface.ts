import { IyanotPaymentMethod } from '@prisma/client';

export type TRecordIyanotPayload = {
  userId: number;
  month: number;
  year: number;
  amount?: number;
  paymentMethod: IyanotPaymentMethod;
  collectedById?: number;
  transactionId?: string;
  remarks?: string;
};
