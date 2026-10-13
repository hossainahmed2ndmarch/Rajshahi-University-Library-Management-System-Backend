import { z } from 'zod';
import { DeliveryMethod, MFSProvider, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const orderItemValidationSchema = z.object({
  bookId: z.number().int().positive(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

const createOrderValidationSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    customerEmail: z.string().email('Valid customer email is required'),
    customerPhone: z.string().min(8, 'Valid phone number is required'),
    shippingAddress: z.string().optional(),
    items: z.array(orderItemValidationSchema).min(1, 'Order must contain at least one book item'),
    deliveryMethod: z.nativeEnum(DeliveryMethod).optional().default(DeliveryMethod.COURIER),
    deliveryCharge: z.number().min(0).optional().default(0),
    couponCode: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
    mfsProvider: z.nativeEnum(MFSProvider).optional(),
    senderPhone: z.string().optional(),
    customerTrxId: z.string().optional(),
    isPOSSale: z.boolean().optional(),
    posNotes: z.string().optional(),
  }),
});

const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    orderStatus: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  }),
});

const verifyOrderPaymentValidationSchema = z.object({
  body: z.object({
    isApproved: z.boolean(),
    notes: z.string().optional(),
  }),
});

const verifyDeliveryOtpValidationSchema = z.object({
  body: z.object({
    otp: z.string().min(4, '6-digit OTP code is required'),
    orderId: z.number().optional(),
    trackingNumber: z.string().optional(),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  verifyOrderPaymentValidationSchema,
  verifyDeliveryOtpValidationSchema,
};
