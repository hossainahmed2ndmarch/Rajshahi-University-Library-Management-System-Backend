import httpStatus from 'http-status';
import { BookType, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import {
  TCreateOrderInput,
  TDispatchCourierInput,
  TUpdateOrderStatusInput,
  TVerifyOrderPaymentInput,
} from './order.interface';
import { createSteadfastOrder } from '../../../lib/steadfast';
import { sendSMS, SMSTemplates } from '../../../lib/sms';
import { emitOrderStatusUpdate } from '../../../lib/socket';

const createOrderInDB = async (payload: TCreateOrderInput, authUserId?: number) => {
  const userId = authUserId || payload.userId || null;
  const customerName = payload.customerName?.trim();
  const customerEmail = payload.customerEmail?.trim();
  const customerPhone = payload.customerPhone?.trim();
  const shippingAddress = payload.shippingAddress?.trim() || 'Counter Pickup (RUIL Central Library)';
  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;

  if (!customerName || !customerEmail || !customerPhone) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Customer name, email, and phone are required!');
  }

  if (!payload.items || payload.items.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order must contain at least one book item!');
  }

  // 1. Validate books & calculate subtotal
  const validatedItems = await Promise.all(
    payload.items.map(async (item) => {
      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
      });

      if (!book) {
        throw new AppError(httpStatus.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
      }

      if (book.type === BookType.BORROW_ONLY) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
      }

      const sellPrice = book.sellPrice != null ? book.sellPrice.toNumber() : 0;
      if (sellPrice <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
      }

      if (book.sellStock < item.quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for "${book.title}". Available: ${book.sellStock}, requested: ${item.quantity}.`
        );
      }

      const roundedUnitPrice = Math.round(sellPrice);
      const roundedTotalPrice = Math.round(roundedUnitPrice * item.quantity);

      return {
        book,
        quantity: item.quantity,
        unitPrice: roundedUnitPrice,
        totalPrice: roundedTotalPrice,
      };
    })
  );

  const subtotal = Math.round(validatedItems.reduce((sum, item) => sum + item.totalPrice, 0));

  // 2. Validate Coupon if provided
  let discountAmount = 0;
  let appliedCoupon = null;

  if (payload.couponCode?.trim()) {
    const cleanCode = payload.couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (coupon && coupon.isActive) {
      const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
      const meetsMinOrder = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;
      const underUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;

      if (isNotExpired && meetsMinOrder && underUsageLimit) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = Math.round(coupon.maxDiscount);
          }
        } else {
          discountAmount = Math.round(Math.min(coupon.discountValue, subtotal));
        }
        appliedCoupon = coupon;
      }
    }
  }

  const rawDelivery = payload.deliveryCharge ?? (payload.deliveryMethod === 'PICKUP' || payload.isPOSSale ? 0 : 60);
  const deliveryCharge = Math.round(rawDelivery);
  const totalAmount = Math.round(Math.max(0, subtotal - discountAmount + deliveryCharge));

  // Generate unique human-readable Order Code and Transaction Reference
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `ORD-${dateStr}-${randomSuffix}`;
  const transactionId = payload.customerTrxId || `TXN-${Date.now()}-${randomSuffix}`;

  // 3. Transactionally create normalized Order and OrderItems, and update inventory
  const createdOrder = await prisma.$transaction(
    async (tx) => {
      // Re-check inventory inside TX to prevent race conditions
      for (const item of validatedItems) {
        const fresh = await tx.book.findUnique({ where: { id: item.book.id } });
        if (!fresh || fresh.sellStock < item.quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient stock for "${item.book.title}". Available: ${fresh?.sellStock ?? 0}, requested: ${item.quantity}.`
          );
        }

        await tx.book.update({
          where: { id: item.book.id },
          data: {
            sellStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // If coupon applied, increment its usedCount
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Create Order
      const isMfs = ['BKASH', 'NAGAD', 'ROCKET'].includes(paymentMethod);
      const isOnlinePaid = paymentMethod === PaymentMethod.ONLINE;

      const order = await tx.order.create({
        data: {
          orderCode,
          transactionId,
          userId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          deliveryMethod: payload.deliveryMethod || 'COURIER',
          deliveryCharge,
          subtotal,
          discountAmount,
          totalAmount,
          couponId: appliedCoupon ? appliedCoupon.id : null,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          orderStatus: payload.isPOSSale ? OrderStatus.DELIVERED : OrderStatus.PENDING,
          paymentStatus: payload.isPOSSale || isOnlinePaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paymentMethod,
          mfsProvider: payload.mfsProvider || (isMfs ? (paymentMethod as any) : null),
          senderPhone: payload.senderPhone || null,
          customerTrxId: payload.customerTrxId || null,
          paymentVerified: payload.isPOSSale || isOnlinePaid,
          verifiedAt: payload.isPOSSale || isOnlinePaid ? new Date() : null,
          isPOSSale: Boolean(payload.isPOSSale),
          posNotes: payload.posNotes || null,
          items: {
            create: validatedItems.map((item) => ({
              bookId: item.book.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              book: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          coupon: true,
        },
      });

      return order;
    },
    { isolationLevel: 'Serializable' }
  );

  // Send Order Placed SMS Notification
  if (createdOrder.customerPhone) {
    sendSMS(
      createdOrder.customerPhone,
      SMSTemplates.orderPlaced(createdOrder.orderCode, createdOrder.totalAmount)
    ).catch((e) => console.error('SMS notification error:', e));
  }

  // Real-time Socket.IO emission
  emitOrderStatusUpdate(createdOrder.orderCode, {
    orderCode: createdOrder.orderCode,
    transactionId: createdOrder.transactionId,
    orderStatus: createdOrder.orderStatus,
    paymentStatus: createdOrder.paymentStatus,
    totalAmount: createdOrder.totalAmount,
  });

  return createdOrder;
};

const getAllOrdersFromDB = async (query: Record<string, unknown>) => {
  const queryObj = { ...query };
  const excludeFields = ['page', 'limit', 'sortBy', 'sortOrder', 'searchTerm', 'buyerType'];
  excludeFields.forEach((field) => delete queryObj[field]);

  const conditions: any[] = [];

  // Search filter
  if (query.searchTerm) {
    const search = String(query.searchTerm).trim();
    conditions.push({
      OR: [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerTrxId: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  // Buyer type filter (MEMBER vs GUEST)
  if (query.buyerType === 'MEMBER') {
    conditions.push({ userId: { not: null } });
  } else if (query.buyerType === 'GUEST') {
    conditions.push({ userId: null });
  }

  if (Object.keys(queryObj).length > 0) {
    conditions.push(queryObj);
  }

  const whereClause = conditions.length > 0 ? { AND: conditions } : {};

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 1000;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            book: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        coupon: true,
      },
      orderBy: {
        createdAt: (query.sortOrder as any) || 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: orders,
  };
};

const getOrderByIdFromDB = async (id: number) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          book: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      coupon: true,
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  return order;
};

const trackOrderByCodeFromDB = async (orderCodeOrTxn: string) => {
  const clean = orderCodeOrTxn.trim();
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderCode: clean },
        { transactionId: clean },
        { trackingNumber: clean },
      ],
    },
    include: {
      items: {
        include: {
          book: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      coupon: true,
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, `No order found with code "${clean}"`);
  }

  return order;
};

const getMyOrdersFromDB = async (userId: number) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          book: true,
        },
      },
      coupon: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateOrderStatusInDB = async (orderId: number, payload: TUpdateOrderStatusInput) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  // If transitioning to CANCELLED and was not previously cancelled, restock books
  if (payload.orderStatus === OrderStatus.CANCELLED && order.orderStatus !== OrderStatus.CANCELLED) {
    return await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            sellStock: {
              increment: item.quantity,
            },
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          ...(payload.paymentStatus && { paymentStatus: payload.paymentStatus }),
        },
        include: {
          items: { include: { book: true } },
          user: true,
        },
      });

      emitOrderStatusUpdate(updated.orderCode, {
        orderStatus: updated.orderStatus,
        paymentStatus: updated.paymentStatus,
      });

      return updated;
    });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(payload.orderStatus && { orderStatus: payload.orderStatus }),
      ...(payload.paymentStatus && { paymentStatus: payload.paymentStatus }),
    },
    include: {
      items: { include: { book: true } },
      user: true,
    },
  });

  emitOrderStatusUpdate(updated.orderCode, {
    orderStatus: updated.orderStatus,
    paymentStatus: updated.paymentStatus,
  });

  return updated;
};

const verifyPaymentInDB = async (orderId: number, payload: TVerifyOrderPaymentInput) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  if (payload.isApproved) {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentVerified: true,
        verifiedAt: new Date(),
        orderStatus: OrderStatus.PROCESSING,
      },
      include: { items: { include: { book: true } }, user: true },
    });

    if (updated.customerPhone) {
      sendSMS(updated.customerPhone, SMSTemplates.paymentApproved(updated.orderCode)).catch(
        (e) => console.error('SMS notification error:', e)
      );
    }

    emitOrderStatusUpdate(updated.orderCode, {
      orderStatus: updated.orderStatus,
      paymentStatus: updated.paymentStatus,
      paymentVerified: true,
    });

    return updated;
  } else {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        paymentVerified: false,
      },
      include: { items: { include: { book: true } }, user: true },
    });

    emitOrderStatusUpdate(updated.orderCode, {
      orderStatus: updated.orderStatus,
      paymentStatus: updated.paymentStatus,
      paymentVerified: false,
    });

    return updated;
  }
};

const dispatchCourierInDB = async (orderId: number, payload?: TDispatchCourierInput) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { book: true } } },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  // Generate 6-digit OTP code for customer delivery confirmation
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date();
  otpExpiresAt.setDate(otpExpiresAt.getDate() + 7);

  const courierName = payload?.courierName || 'Steadfast Courier';

  // Book with Steadfast API
  const codAmount = order.paymentStatus === PaymentStatus.PAID ? 0 : order.totalAmount;
  const steadfastResult = await createSteadfastOrder({
    invoice: order.orderCode,
    recipient_name: order.customerName,
    recipient_phone: order.customerPhone,
    recipient_address: order.shippingAddress || 'Rajshahi University',
    cod_amount: codAmount,
    note: payload?.note || `RUIL Book Parcel: ${order.items.map((i) => i.book.title).join(', ')}`,
  });

  const trackingNumber =
    steadfastResult.consignment?.tracking_code || `TRK-${Date.now().toString().slice(-6)}`;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      courierName,
      trackingNumber,
      orderStatus: OrderStatus.SHIPPED,
      shippedAt: new Date(),
      deliveryOtpHash: rawOtp,
      otpExpiresAt,
      otpVerified: false,
    },
    include: { items: { include: { book: true } }, user: true },
  });

  // SMS Customer with tracking number and OTP
  if (updated.customerPhone) {
    sendSMS(
      updated.customerPhone,
      SMSTemplates.courierShippedWithOTP(
        updated.orderCode,
        courierName,
        trackingNumber,
        rawOtp
      )
    ).catch((e) => console.error('SMS notification error:', e));
  }

  emitOrderStatusUpdate(updated.orderCode, {
    orderStatus: updated.orderStatus,
    courierName: updated.courierName,
    trackingNumber: updated.trackingNumber,
    shippedAt: updated.shippedAt,
  });

  return {
    order: updated,
    rawOtp,
    trackingNumber,
    courierName,
  };
};

/**
 * Public or authenticated OTP verification:
 * Can be called by delivery riders via public delivery confirmation page!
 */
const verifyDeliveryOtpInDB = async (
  identifier: { orderId?: number; trackingNumber?: string },
  otp: string
) => {
  const cleanOtp = otp.trim();

  const whereClause: any = {};
  if (identifier.orderId) whereClause.id = identifier.orderId;
  else if (identifier.trackingNumber) whereClause.trackingNumber = identifier.trackingNumber.trim();
  else throw new AppError(httpStatus.BAD_REQUEST, 'OrderId or trackingNumber is required!');

  const order = await prisma.order.findFirst({
    where: whereClause,
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order parcel record not found!');
  }

  if (!order.deliveryOtpHash) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No delivery OTP was issued for this order!');
  }

  if (order.otpVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Delivery OTP has already been verified for this parcel!');
  }

  if (order.otpExpiresAt && new Date() > new Date(order.otpExpiresAt)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Delivery OTP has expired!');
  }

  if (order.deliveryOtpHash !== cleanOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid 6-digit OTP code!');
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      otpVerified: true,
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      deliveredAt: new Date(),
    },
    include: { items: { include: { book: true } }, user: true },
  });

  if (updated.customerPhone) {
    sendSMS(updated.customerPhone, SMSTemplates.orderDelivered(updated.orderCode)).catch(
      (e) => console.error('SMS notification error:', e)
    );
  }

  emitOrderStatusUpdate(updated.orderCode, {
    orderStatus: updated.orderStatus,
    paymentStatus: updated.paymentStatus,
    deliveredAt: updated.deliveredAt,
    otpVerified: true,
  });

  return updated;
};

const cancelOrderInDB = async (orderId: number, userId?: number, isStaff?: boolean) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  if (!isStaff && userId && order.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to cancel this order.');
  }

  if (order.orderStatus !== OrderStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel order with status "${order.orderStatus}". Only PENDING orders can be cancelled.`
    );
  }

  return await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.book.update({
        where: { id: item.bookId },
        data: {
          sellStock: {
            increment: item.quantity,
          },
        },
      });
    }

    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
      include: { items: { include: { book: true } }, user: true },
    });

    emitOrderStatusUpdate(cancelled.orderCode, {
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
    });

    return cancelled;
  });
};

const deleteOrderInDB = async (orderId: number) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found!');
  }

  // If pending or processing, restore inventory
  if (order.orderStatus === OrderStatus.PENDING || order.orderStatus === OrderStatus.PROCESSING) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            sellStock: {
              increment: item.quantity,
            },
          },
        });
      }
      await tx.order.delete({ where: { id: orderId } });
    });
    return true;
  }

  await prisma.order.delete({ where: { id: orderId } });
  return true;
};

export const OrderService = {
  createOrderInDB,
  getAllOrdersFromDB,
  getOrderByIdFromDB,
  trackOrderByCodeFromDB,
  getMyOrdersFromDB,
  updateOrderStatusInDB,
  verifyPaymentInDB,
  dispatchCourierInDB,
  verifyDeliveryOtpInDB,
  cancelOrderInDB,
  deleteOrderInDB,
};
