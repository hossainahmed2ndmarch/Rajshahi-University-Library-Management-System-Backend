import httpStatus from 'http-status';
import { BookType, OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TGuestPurchase, TMemberPurchase, TPurchaseItem } from './purchase.interface';
import { createSteadfastOrder } from '../../../lib/steadfast';
import { sendSMS, SMSTemplates } from '../../../lib/sms';
import { emitOrderStatusUpdate } from '../../../lib/socket';

const normalizeItems = (payload: { items?: TPurchaseItem[]; bookId?: number; quantity?: number }): TPurchaseItem[] => {
  if (payload.items && payload.items.length > 0) {
    return payload.items;
  }
  if (payload.bookId) {
    return [{ bookId: payload.bookId, quantity: payload.quantity || 1 }];
  }
  throw new AppError(httpStatus.BAD_REQUEST, 'No purchase items provided!');
};

const createGuestPurchaseInDB = async (payload: TGuestPurchase) => {
  const customerName = payload.guestName || payload.customerName;
  const customerEmail = payload.guestEmail || payload.customerEmail;
  const customerPhone = payload.guestPhone || payload.customerPhone;
  const shippingAddress = payload.address || payload.shippingAddress;
  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing required guest contact information!');
  }

  const items = normalizeItems(payload);

  const validatedItems = await Promise.all(
    items.map(async (item) => {
      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
      });

      if (!book) {
        throw new AppError(httpStatus.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
      }

      if (book.type === BookType.BORROW_ONLY) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
      }

      // Convert Decimal to number for comparison and arithmetic
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

      return {
        book,
        quantity: item.quantity,
        unitPrice: sellPrice,
        totalAmount: sellPrice * item.quantity,
      };
    })
  );

  const baseTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Serializable transaction prevents concurrent purchases from both consuming the last copy
  const createdPurchases = await prisma.$transaction(
    async (tx) => {
      const results = [];

      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;

        // Re-check live stock inside TX to prevent TOCTOU race condition
        const freshBook = await tx.book.findUnique({ where: { id: item.book.id } });
        if (!freshBook || freshBook.sellStock < item.quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient stock for "${item.book.title}". Available: ${freshBook?.sellStock ?? 0}, requested: ${item.quantity}.`
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

        const purchase = await tx.purchase.create({
          data: {
            transactionId: txnId,
            userId: null,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            bookId: item.book.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            paymentMethod,
            orderStatus: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
          },
          include: {
            book: true,
          },
        });

        results.push(purchase);
      }

      return results;
    },
    { isolationLevel: 'Serializable' }
  );

  return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
};

const createMemberPurchaseInDB = async (payload: TMemberPurchase, userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const customerName = payload.customerName || user.name;
  const customerEmail = payload.customerEmail || user.email;
  const customerPhone = payload.customerPhone || user.phone;
  const shippingAddress = payload.shippingAddress || payload.address;
  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;

  if (!shippingAddress) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Shipping address is required!');
  }

  const items = normalizeItems(payload);

  const validatedItems = await Promise.all(
    items.map(async (item) => {
      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
      });

      if (!book) {
        throw new AppError(httpStatus.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
      }

      if (book.type === BookType.BORROW_ONLY) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be purchased!`);
      }

      // Convert Decimal to number for comparison and arithmetic
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

      return {
        book,
        quantity: item.quantity,
        unitPrice: sellPrice,
        totalAmount: sellPrice * item.quantity,
      };
    })
  );

  const baseTxnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Serializable transaction prevents concurrent purchases from both consuming the last copy
  const createdPurchases = await prisma.$transaction(
    async (tx) => {
      const results = [];

      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;

        // Re-check live stock inside TX to prevent TOCTOU race condition
        const freshBook = await tx.book.findUnique({ where: { id: item.book.id } });
        if (!freshBook || freshBook.sellStock < item.quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient stock for "${item.book.title}". Available: ${freshBook?.sellStock ?? 0}, requested: ${item.quantity}.`
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

        const purchase = await tx.purchase.create({
          data: {
            transactionId: txnId,
            userId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            bookId: item.book.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            paymentMethod,
            orderStatus: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
          },
          include: {
            book: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        await tx.payment.create({
          data: {
            transactionId: txnId,
            userId,
            amount: item.totalAmount,
            paymentMethod,
            status: PaymentStatus.PENDING,
          },
        });

        results.push(purchase);
      }

      return results;
    },
    { isolationLevel: 'Serializable' }
  );

  return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
};

const getAllPurchasesFromDB = async (
  query: Record<string, unknown>,
  user?: { userId: number; role: string }
) => {
  const queryParams = { ...query };

  if (user && user.role === UserRole.MEMBER) {
    queryParams.userId = user.userId;
  }

  const purchaseQuery = new QueryBuilder(prisma.purchase, queryParams, {
    searchableFields: ['transactionId', 'customerName', 'customerEmail', 'customerPhone', 'book.title'],
    filterableFields: ['orderStatus', 'paymentStatus', 'paymentMethod', 'userId', 'bookId', 'transactionId'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

  return await purchaseQuery.execute();
};

const getGuestOrdersFromDB = async (payload: { email: string; phone?: string; transactionId?: string }) => {
  const { email, phone, transactionId } = payload;
  if (!email && !phone && !transactionId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email, phone, or transaction ID is required to lookup guest orders!');
  }

  const whereConditions: Array<Record<string, unknown>> = [];

  if (email) {
    whereConditions.push({ customerEmail: { equals: email.trim(), mode: 'insensitive' } });
  }

  if (phone) {
    whereConditions.push({ customerPhone: { contains: phone.trim() } });
  }

  if (transactionId) {
    whereConditions.push({ transactionId: { equals: transactionId.trim() } });
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      OR: whereConditions,
    },
    include: {
      book: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return purchases;
};

const trackGuestOrderByTxnIdFromDB = async (transactionId: string, email?: string) => {
  if (!transactionId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Transaction ID is required for tracking!');
  }

  const purchase = await prisma.purchase.findUnique({
    where: { transactionId: transactionId.trim() },
    include: {
      book: true,
    },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, `Order with tracking code #${transactionId} not found!`);
  }

  if (email && purchase.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
    throw new AppError(httpStatus.FORBIDDEN, 'The provided email does not match the order records.');
  }

  return purchase;
};

const cancelGuestPurchaseInDB = async (payload: { transactionId: string; email: string; reason?: string }) => {
  const { transactionId, email } = payload;

  const purchase = await prisma.purchase.findUnique({
    where: { transactionId: transactionId.trim() },
    include: { book: true },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, `Order with transaction #${transactionId} not found!`);
  }

  if (purchase.customerEmail.toLowerCase() !== email.trim().toLowerCase()) {
    throw new AppError(httpStatus.FORBIDDEN, 'Email address does not match this order reference.');
  }

  if (purchase.orderStatus !== OrderStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel order with status "${purchase.orderStatus}". Only PENDING orders can be cancelled.`
    );
  }

  // Transactionally update status to CANCELLED and restock book quantity
  const updatedPurchase = await prisma.$transaction(async (tx) => {
    // Restock book sell inventory
    await tx.book.update({
      where: { id: purchase.bookId },
      data: {
        sellStock: {
          increment: purchase.quantity,
        },
      },
    });

    // Update purchase status
    const cancelled = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
      include: {
        book: true,
      },
    });

    return cancelled;
  });

  if (updatedPurchase.transactionId) {
    emitOrderStatusUpdate(updatedPurchase.transactionId, {
      orderStatus: updatedPurchase.orderStatus,
      paymentStatus: updatedPurchase.paymentStatus,
    });
  }

  return updatedPurchase;
};

const cancelMemberPurchaseInDB = async (purchaseId: number, userId: number, userRole: string, reason?: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { book: true },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase record not found!');
  }

  const isStaff = (['SUPER_ADMIN', 'ADMIN', 'SHIFTER'] as string[]).includes(userRole);

  if (!isStaff && purchase.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to cancel this purchase.');
  }

  if (purchase.orderStatus !== OrderStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel order with status "${purchase.orderStatus}". Only PENDING orders can be cancelled.`
    );
  }

  // Transactionally update status to CANCELLED and restock book quantity
  const updatedPurchase = await prisma.$transaction(async (tx) => {
    await tx.book.update({
      where: { id: purchase.bookId },
      data: {
        sellStock: {
          increment: purchase.quantity,
        },
      },
    });

    const cancelled = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
      include: {
        book: true,
      },
    });

    // Also update associated payment record if exists
    await tx.payment.updateMany({
      where: { transactionId: purchase.transactionId },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });

    return cancelled;
  });

  if (updatedPurchase.transactionId) {
    emitOrderStatusUpdate(updatedPurchase.transactionId, {
      orderStatus: updatedPurchase.orderStatus,
      paymentStatus: updatedPurchase.paymentStatus,
    });
  }

  return updatedPurchase;
};

const updatePurchaseStatusInDB = async (
  purchaseId: number,
  payload: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }
) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { book: true },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase record not found!');
  }

  // If status is transitioning to CANCELLED and was not previously CANCELLED, restock book inventory
  if (
    payload.orderStatus === OrderStatus.CANCELLED &&
    purchase.orderStatus !== OrderStatus.CANCELLED
  ) {
    return await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: purchase.bookId },
        data: {
          sellStock: {
            increment: purchase.quantity,
          },
        },
      });

      const updated = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          ...(payload.paymentStatus && { paymentStatus: payload.paymentStatus }),
        },
        include: {
          book: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (updated.transactionId) {
        emitOrderStatusUpdate(updated.transactionId, {
          orderStatus: updated.orderStatus,
          paymentStatus: updated.paymentStatus,
        });
      }

      return updated;
    });
  }

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      ...(payload.orderStatus && { orderStatus: payload.orderStatus }),
      ...(payload.paymentStatus && { paymentStatus: payload.paymentStatus }),
    },
    include: {
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (updated.transactionId) {
    emitOrderStatusUpdate(updated.transactionId, {
      orderStatus: updated.orderStatus,
      paymentStatus: updated.paymentStatus,
    });
  }

  return updated;
};

const verifyPaymentInDB = async (
  purchaseId: number,
  payload: { isApproved: boolean; notes?: string }
) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase record not found!');
  }

  if (payload.isApproved) {
    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentVerified: true,
        verifiedAt: new Date(),
        orderStatus: OrderStatus.PROCESSING,
      },
      include: { book: true, user: true },
    });

    // Also update associated payment record if exists
    if (purchase.transactionId) {
      await prisma.payment.updateMany({
        where: { transactionId: purchase.transactionId },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          verifiedAt: new Date(),
        },
      });
    }

    // Send SMS confirmation for verified payment
    if (updated.customerPhone) {
      sendSMS(updated.customerPhone, SMSTemplates.paymentApproved(updated.transactionId)).catch(
        (e) => console.error('SMS notification error:', e)
      );
    }

    if (updated.transactionId) {
      emitOrderStatusUpdate(updated.transactionId, {
        orderStatus: updated.orderStatus,
        paymentStatus: updated.paymentStatus,
        paymentVerified: updated.paymentVerified,
      });
    }

    return updated;
  } else {
    // Rejected payment
    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        paymentVerified: false,
      },
      include: { book: true, user: true },
    });

    if (updated.transactionId) {
      emitOrderStatusUpdate(updated.transactionId, {
        orderStatus: updated.orderStatus,
        paymentStatus: updated.paymentStatus,
        paymentVerified: updated.paymentVerified,
      });
    }

    return updated;
  }
};

const dispatchCourierInDB = async (
  purchaseId: number,
  payload?: { courierName?: string; note?: string }
) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { book: true },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase record not found!');
  }

  // Generate a random 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date();
  otpExpiresAt.setDate(otpExpiresAt.getDate() + 7); // 7 days validity for parcel delivery

  const courierName = payload?.courierName || 'Steadfast Courier';

  // Book consignment with Steadfast Courier API
  const codAmount = purchase.paymentStatus === PaymentStatus.PAID ? 0 : purchase.totalAmount;
  const steadfastResult = await createSteadfastOrder({
    invoice: purchase.transactionId,
    recipient_name: purchase.customerName,
    recipient_phone: purchase.customerPhone,
    recipient_address: purchase.shippingAddress,
    cod_amount: codAmount,
    note: payload?.note || `Book parcel: ${purchase.book?.title || 'RUIL Books'}`,
  });

  const trackingNumber =
    steadfastResult.consignment?.tracking_code ||
    `TRK-${Date.now().toString().slice(-6)}`;

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      courierName,
      trackingNumber,
      orderStatus: OrderStatus.SHIPPED,
      shippedAt: new Date(),
      deliveryOtpHash: rawOtp,
      otpExpiresAt,
      otpVerified: false,
    },
    include: { book: true, user: true },
  });

  // Send SMS to customer with tracking number and Delivery OTP
  if (updated.customerPhone) {
    sendSMS(
      updated.customerPhone,
      SMSTemplates.courierShippedWithOTP(
        updated.transactionId,
        courierName,
        trackingNumber,
        rawOtp
      )
    ).catch((e) => console.error('SMS notification error:', e));
  }

  if (updated.transactionId) {
    emitOrderStatusUpdate(updated.transactionId, {
      orderStatus: updated.orderStatus,
      courierName: updated.courierName,
      trackingNumber: updated.trackingNumber,
      shippedAt: updated.shippedAt,
    });
  }

  return {
    purchase: updated,
    rawOtp,
    trackingNumber,
    courierName,
  };
};

const verifyDeliveryOtpInDB = async (purchaseId: number, otp: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase record not found!');
  }

  if (!purchase.deliveryOtpHash) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No delivery OTP was issued for this order!');
  }

  if (purchase.otpVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Delivery OTP has already been verified for this order!');
  }

  if (purchase.otpExpiresAt && new Date() > new Date(purchase.otpExpiresAt)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Delivery OTP has expired!');
  }

  // Plain comparison or sha256
  const cleanInputOtp = otp.trim();
  if (purchase.deliveryOtpHash !== cleanInputOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid delivery OTP code!');
  }

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      otpVerified: true,
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      deliveredAt: new Date(),
    },
    include: { book: true, user: true },
  });

  // Send SMS confirmation of successful delivery
  if (updated.customerPhone) {
    sendSMS(updated.customerPhone, SMSTemplates.orderDelivered(updated.transactionId)).catch(
      (e) => console.error('SMS notification error:', e)
    );
  }

  if (updated.transactionId) {
    emitOrderStatusUpdate(updated.transactionId, {
      orderStatus: updated.orderStatus,
      paymentStatus: updated.paymentStatus,
      deliveredAt: updated.deliveredAt,
      otpVerified: true,
    });
  }

  return updated;
};

const createPOSSaleInDB = async (
  payload: {
    buyerType: 'MEMBER' | 'GUEST';
    memberId?: number;
    studentOrVoterId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: string;
    items?: TPurchaseItem[];
    bookId?: number;
    quantity?: number;
    paymentMethod?: PaymentMethod;
    notes?: string;
  },
  shifterId: number
) => {
  let userId: number | null = null;

  if (payload.buyerType === 'MEMBER') {
    let member = null;
    if (payload.memberId && !isNaN(Number(payload.memberId))) {
      member = await prisma.user.findUnique({ where: { id: Number(payload.memberId) } });
    }
    if (!member && (payload.studentOrVoterId || payload.customerPhone || payload.customerEmail)) {
      const orClauses = [];
      if (payload.studentOrVoterId?.trim()) orClauses.push({ studentOrVoterId: payload.studentOrVoterId.trim() });
      if (payload.customerPhone?.trim()) orClauses.push({ phone: payload.customerPhone.trim() });
      if (payload.customerEmail?.trim()) orClauses.push({ email: payload.customerEmail.trim() });

      if (orClauses.length > 0) {
        member = await prisma.user.findFirst({
          where: { OR: orClauses },
        });
      }
    }
    if (member) {
      userId = member.id;
    }
  }

  const customerName =
    payload.customerName?.trim() ||
    (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.name || 'Library Member' : 'Walk-in Guest');
  const customerPhone =
    payload.customerPhone?.trim() ||
    (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.phone || 'N/A' : 'N/A');
  const rawDigits = customerPhone && customerPhone !== 'N/A' ? customerPhone.replace(/[^0-9]/g, '') : '';
  const customerEmail =
    payload.customerEmail?.trim() ||
    (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.email : undefined) ||
    `${rawDigits || `pos_${Date.now()}`}@guest.ruil.ac.bd`;
  const shippingAddress = payload.shippingAddress || 'Counter Desk Pickup (POS Counter Sale)';
  const paymentMethod = payload.paymentMethod || PaymentMethod.CASH;

  const items = normalizeItems(payload);

  const validatedItems = await Promise.all(
    items.map(async (item) => {
      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
      });

      if (!book) {
        throw new AppError(httpStatus.NOT_FOUND, `Book with ID ${item.bookId} not found!`);
      }

      if (book.type === BookType.BORROW_ONLY) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" is borrow-only and cannot be sold!`);
      }

      // Convert Decimal to number for comparison and arithmetic
      const sellPrice = book.sellPrice != null ? book.sellPrice.toNumber() : 0;

      if (sellPrice <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, `Book "${book.title}" does not have a valid sale price!`);
      }

      if (book.sellStock < item.quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for "${book.title}". Available in stock: ${book.sellStock}, requested: ${item.quantity}.`
        );
      }

      return {
        book,
        quantity: item.quantity,
        unitPrice: sellPrice,
        totalAmount: sellPrice * item.quantity,
      };
    })
  );

  const baseTxnId = `POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Serializable transaction prevents two concurrent POS sales from consuming the last copy
  const createdPurchases = await prisma.$transaction(
    async (tx) => {
      const results = [];

      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        const txnId = validatedItems.length === 1 ? baseTxnId : `${baseTxnId}-${i + 1}`;

        // Re-check live stock inside TX to prevent TOCTOU race condition
        const freshBook = await tx.book.findUnique({ where: { id: item.book.id } });
        if (!freshBook || freshBook.sellStock < item.quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient stock for "${item.book.title}". Available: ${freshBook?.sellStock ?? 0}, requested: ${item.quantity}.`
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

        const purchase = await tx.purchase.create({
          data: {
            transactionId: txnId,
            userId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            bookId: item.book.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            paymentMethod,
            orderStatus: OrderStatus.DELIVERED,
            paymentStatus: PaymentStatus.PAID,
            approvedById: shifterId,
          },
          include: {
            book: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                studentOrVoterId: true,
              },
            },
          },
        });

        if (userId) {
          await tx.payment.create({
            data: {
              transactionId: txnId,
              userId,
              amount: item.totalAmount,
              paymentMethod,
              status: PaymentStatus.COMPLETED,
              paidAt: new Date(),
            },
          });
        }

        results.push(purchase);
      }

      return results;
    },
    { isolationLevel: 'Serializable' }
  );

  return createdPurchases.length === 1 ? createdPurchases[0] : createdPurchases;
};

const deletePurchaseInDB = async (purchaseId: number) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, 'Purchase order record not found!');
  }

  // If order was in pending or processing status and not delivered/cancelled, optionally restore stock
  if (purchase.orderStatus === OrderStatus.PENDING || purchase.orderStatus === OrderStatus.PROCESSING) {
    return await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: purchase.bookId },
        data: {
          sellStock: {
            increment: purchase.quantity,
          },
        },
      });

      return await tx.purchase.delete({
        where: { id: purchaseId },
      });
    });
  }

  return await prisma.purchase.delete({
    where: { id: purchaseId },
  });
};

export const PurchaseService = {
  createGuestPurchaseInDB,
  createMemberPurchaseInDB,
  createPOSSaleInDB,
  getAllPurchasesFromDB,
  getGuestOrdersFromDB,
  trackGuestOrderByTxnIdFromDB,
  cancelGuestPurchaseInDB,
  cancelMemberPurchaseInDB,
  updatePurchaseStatusInDB,
  verifyPaymentInDB,
  dispatchCourierInDB,
  verifyDeliveryOtpInDB,
  deletePurchaseInDB,
};


