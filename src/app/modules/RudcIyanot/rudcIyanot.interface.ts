import { IyanotPaymentMethod } from '@prisma/client';

export type TRecordIyanotPayload = {
  userId: string;
  month: number;
  year: number;
  amount?: number;
  paymentMethod: IyanotPaymentMethod;
  collectedById?: string;
  transactionId?: string;
  remarks?: string;
};
