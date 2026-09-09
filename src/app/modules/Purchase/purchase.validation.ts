import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

const purchaseItemSchema = z.object({
  bookId: z.number().int('Book ID must be an integer').positive('Book ID must be positive'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive').default(1),
});

const guestPurchaseValidationSchema = z.object({
  body: z
    .object({
      guestName: z.string().min(1, 'Guest name is required').optional(),
      customerName: z.string().min(1, 'Customer name is required').optional(),
      guestEmail: z.string().email('Valid guest email address is required').optional(),
      customerEmail: z.string().email('Valid customer email address is required').optional(),
      guestPhone: z.string().min(1, 'Guest phone is required').optional(),
      customerPhone: z.string().min(1, 'Customer phone is required').optional(),
      address: z.string().min(1, 'Address is required').optional(),
      shippingAddress: z.string().min(1, 'Shipping address is required').optional(),
      paymentMethod: z.nativeEnum(PaymentMethod).optional(),
      items: z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
      bookId: z.number().int().positive().optional(),
      quantity: z.number().int().positive().optional(),
    })
    .refine((data) => data.guestName || data.customerName, {
      message: 'Full Name is required',
      path: ['guestName'],
    })
    .refine((data) => data.guestEmail || data.customerEmail, {
      message: 'Valid Email Address is required for guest purchases',
      path: ['guestEmail'],
    })
    .refine((data) => data.guestPhone || data.customerPhone, {
      message: 'Phone number is required',
      path: ['guestPhone'],
    })
    .refine((data) => data.address || data.shippingAddress, {
      message: 'Shipping delivery address is required',
      path: ['shippingAddress'],
    })
    .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
      message: 'Either items array or bookId is required',
      path: ['items'],
    }),
});

const memberPurchaseValidationSchema = z.object({
  body: z
    .object({
      shippingAddress: z.string().min(1, 'Shipping address is required').optional(),
      address: z.string().min(1, 'Address is required').optional(),
      customerPhone: z.string().optional(),
      paymentMethod: z.nativeEnum(PaymentMethod).optional(),
      items: z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
      bookId: z.number().int().positive().optional(),
      quantity: z.number().int().positive().optional(),
    })
    .refine((data) => data.shippingAddress || data.address, {
      message: 'Shipping address is required',
      path: ['shippingAddress'],
    })
    .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
      message: 'Either items array or bookId is required',
      path: ['items'],
    }),
});

const guestOrdersLookupValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required to lookup guest orders'),
    phone: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

const guestCancelOrderValidationSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
    email: z.string().email('Valid email address is required to authorize order cancellation'),
    reason: z.string().max(300, 'Reason cannot exceed 300 characters').optional(),
  }),
});

const posSaleValidationSchema = z.object({
  body: z
    .object({
      buyerType: z.enum(['MEMBER', 'GUEST']).default('MEMBER'),
      memberId: z.number().int().positive().optional(),
      studentOrVoterId: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
      shippingAddress: z.string().optional(),
      paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CASH),
      items: z.array(purchaseItemSchema).min(1, 'At least one item is required').optional(),
      bookId: z.number().int().positive().optional(),
      quantity: z.number().int().positive().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => (data.items && data.items.length > 0) || data.bookId, {
      message: 'Either items array or bookId is required',
      path: ['items'],
    }),
});

export const PurchaseValidation = {
  guestPurchaseValidationSchema,
  memberPurchaseValidationSchema,
  guestOrdersLookupValidationSchema,
  guestCancelOrderValidationSchema,
  posSaleValidationSchema,
};

