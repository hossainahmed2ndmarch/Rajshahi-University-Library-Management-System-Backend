import httpStatus from 'http-status';
import { BookType, DonationStatus, UserRole } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../../lib/db';
import QueryBuilder from '../../builder/queryBuilder';
import { TApproveDonationPayload, TConvertDonationToStock, TGuestDonation } from './donation.interface';

const createDonationInDB = async (payload: TGuestDonation, donorId?: number) => {
  const {
    bookTitle,
    author,
    category,
    quantity,
    method,
    isAnonymous,
    donorName,
    donorEmail,
    contactPhone,
    donorNote,
    pickupAddress,
    scheduledAt,
  } = payload as TGuestDonation & {
    donorPhone?: string;
    notes?: string;
    condition?: string;
  };

  const rawContactPhone = contactPhone || (payload as { donorPhone?: string }).donorPhone || null;
  const rawDonorNote = donorNote || (payload as { notes?: string }).notes || null;
  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

  return await prisma.donation.create({
    data: {
      bookTitle: bookTitle || 'Donated Book',
      author: author || 'Unknown Author',
      category: category || 'General',
      quantity: quantity && quantity > 0 ? quantity : 1,
      method: method || 'LIBRARY_DROP_OFF',
      isAnonymous: Boolean(isAnonymous),
      donorName: isAnonymous ? 'Anonymous Donor' : (donorName || null),
      donorEmail: donorEmail || null,
      contactPhone: rawContactPhone,
      donorNote: rawDonorNote,
      pickupAddress: pickupAddress || null,
      scheduledAt: parsedScheduledAt,
      donorId: donorId || null,
      status: DonationStatus.PENDING,
    },
  });
};

const approveDonationInDB = async (
  donationId: number,
  adminId: number,
  payload?: TApproveDonationPayload
) => {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { donor: true },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation request not found!');
  }

  if (donation.status === DonationStatus.APPROVED || donation.status === DonationStatus.RECEIVED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This donation has already been received/approved!');
  }

  // Atomic transaction to ensure book is created/updated and donation status is marked APPROVED/RECEIVED
  const result = await prisma.$transaction(async (tx) => {
    let bookId = donation.catalogedBookId;

    if (bookId) {
      // If already linked, increment borrow stock
      const quantityToAdd = payload?.borrowStock ?? (donation.quantity || 1);
      await tx.book.update({
        where: { id: bookId },
        data: {
          borrowStock: { increment: quantityToAdd },
          ...(payload?.sellStock ? { sellStock: { increment: payload.sellStock } } : {}),
          ...(payload?.locationCell ? { locationCell: payload.locationCell } : {}),
        },
      });
    } else {
      // Check if book with matching ISBN or title+author or title already exists in library catalog
      let existingBook = null;

      if (payload?.isbn?.trim()) {
        existingBook = await tx.book.findUnique({
          where: { isbn: payload.isbn.trim() },
        });
      }

      const trimmedTitle = donation.bookTitle?.trim();
      const trimmedAuthor = donation.author?.trim();

      if (!existingBook && trimmedTitle && trimmedTitle.toLowerCase() !== 'donated book') {
        if (trimmedAuthor && trimmedAuthor.toLowerCase() !== 'unknown author') {
          existingBook = await tx.book.findFirst({
            where: {
              title: { equals: trimmedTitle, mode: 'insensitive' },
              author: { equals: trimmedAuthor, mode: 'insensitive' },
            },
          });
        }

        if (!existingBook) {
          existingBook = await tx.book.findFirst({
            where: {
              title: { equals: trimmedTitle, mode: 'insensitive' },
            },
          });
        }
      }

      if (existingBook) {
        bookId = existingBook.id;
        const quantityToAdd = payload?.borrowStock ?? (donation.quantity || 1);
        await tx.book.update({
          where: { id: existingBook.id },
          data: {
            borrowStock: { increment: quantityToAdd },
            ...(payload?.sellStock ? { sellStock: { increment: payload.sellStock } } : {}),
            ...(payload?.locationCell ? { locationCell: payload.locationCell } : {}),
          },
        });
      } else {
        // Automatically add to books as borrowable (BORROW_ONLY)
        const generatedIsbn =
          payload?.isbn?.trim() || `DON-${donation.id}-${Date.now().toString().slice(-6)}`;
        const initialPages = payload?.pages || 150;
        const initialLocation = payload?.locationCell || 'DONATION-DESK';
        const assignedCat = payload?.assignedCategory || donation.category || 'General';

        const newBook = await tx.book.create({
          data: {
            title: donation.bookTitle || 'Donated Book',
            author: donation.author || 'Unknown Author',
            isbn: generatedIsbn,
            locationCell: initialLocation,
            category: assignedCat,
            pages: initialPages,
            type: BookType.BORROW_ONLY,
            sellPrice: null,
            borrowStock: payload?.borrowStock ?? (donation.quantity || 1),
            sellStock: payload?.sellStock ?? 0,
            description:
              donation.donorNote ||
              'Donated book added into library catalog collection as borrowable. Further details can be updated by admin/shifter.',
            addedById: adminId,
            donatedById: donation.donorId || null,
          },
        });

        bookId = newBook.id;
      }
    }

    // Update donation status to APPROVED (or RECEIVED) and link catalogedBookId
    const updatedDonation = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: DonationStatus.APPROVED,
        catalogedBookId: bookId,
        receivedById: adminId,
        receivedAt: new Date(),
      },
      include: {
        catalogedBook: true,
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return updatedDonation;
  });

  return result;
};

const rejectDonationInDB = async (donationId: number) => {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation request not found!');
  }

  if (donation.status === DonationStatus.REJECTED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Donation has already been rejected!');
  }

  return await prisma.donation.update({
    where: { id: donationId },
    data: { status: DonationStatus.REJECTED },
  });
};

const convertDonationToStock = async (
  donationId: number,
  payload: TConvertDonationToStock,
  adminId: number
) => {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation request not found!');
  }

  if (donation.status === DonationStatus.CATALOGED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This donation has already been converted into catalog stock!');
  }

  // Check if book with matching ISBN or title+author already exists
  let existingBook = null;
  if (payload.isbn?.trim()) {
    existingBook = await prisma.book.findUnique({
      where: { isbn: payload.isbn.trim() },
    });
  }

  const trimmedTitle = donation.bookTitle?.trim();
  const trimmedAuthor = donation.author?.trim();

  if (!existingBook && trimmedTitle && trimmedTitle.toLowerCase() !== 'donated book') {
    if (trimmedAuthor && trimmedAuthor.toLowerCase() !== 'unknown author') {
      existingBook = await prisma.book.findFirst({
        where: {
          title: { equals: trimmedTitle, mode: 'insensitive' },
          author: { equals: trimmedAuthor, mode: 'insensitive' },
        },
      });
    }

    if (!existingBook) {
      existingBook = await prisma.book.findFirst({
        where: {
          title: { equals: trimmedTitle, mode: 'insensitive' },
        },
      });
    }
  }

  // Atomic transaction to create or update Book entry and mark Donation as CATALOGED
  const result = await prisma.$transaction(async (tx) => {
    let bookId: number;

    if (existingBook) {
      bookId = existingBook.id;
      const addBorrow = payload.borrowStock ?? (payload.type !== 'SELL_ONLY' ? donation.quantity : 0);
      const addSell = payload.sellStock ?? (payload.type !== 'BORROW_ONLY' ? donation.quantity : 0);

      await tx.book.update({
        where: { id: existingBook.id },
        data: {
          borrowStock: { increment: addBorrow },
          sellStock: { increment: addSell },
          ...(payload.locationCell ? { locationCell: payload.locationCell } : {}),
          ...(payload.sellPrice ? { sellPrice: payload.sellPrice } : {}),
        },
      });
    } else {
      const book = await tx.book.create({
        data: {
          title: donation.bookTitle || 'Donated Book',
          author: donation.author || 'Unknown Author',
          isbn: payload.isbn,
          locationCell: payload.locationCell,
          category: donation.category || 'General',
          pages: payload.pages,
          type: payload.type as BookType,
          sellPrice: payload.sellPrice || null,
          borrowStock: payload.borrowStock ?? (payload.type !== 'SELL_ONLY' ? donation.quantity : 0),
          sellStock: payload.sellStock ?? (payload.type !== 'BORROW_ONLY' ? donation.quantity : 0),
          coverImage: payload.coverImage || null,
          description: payload.description || donation.donorNote || null,
          addedById: adminId,
          donatedById: donation.donorId || null,
        },
      });
      bookId = book.id;
    }

    const updatedDonation = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: DonationStatus.CATALOGED,
        catalogedBookId: bookId,
        receivedById: adminId,
        receivedAt: donation.receivedAt || new Date(),
      },
      include: {
        catalogedBook: true,
      },
    });

    return updatedDonation;
  });

  return result;
};

const getAllDonationsFromDB = async (
  query: Record<string, unknown>,
  user?: { userId: number; role: string; email?: string }
) => {
  const queryParams = { ...query };
  queryParams.limit = queryParams.limit ? Number(queryParams.limit) : 100;

  const donationQuery = new QueryBuilder(prisma.donation, queryParams, {
    searchableFields: ['bookTitle', 'author', 'category', 'donorName', 'donorEmail', 'contactPhone'],
    filterableFields: ['status', 'method', 'isAnonymous', 'donorId'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      donor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      receivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      catalogedBook: true,
    });

  if (user && user.role === UserRole.MEMBER) {
    donationQuery.where({
      OR: [
        { donorId: user.userId },
        ...(user.email
          ? [
              {
                donorEmail: {
                  equals: user.email,
                  mode: 'insensitive',
                },
              },
            ]
          : []),
      ],
    });
  }

  return await donationQuery.execute();
};

const createPOSDonationInDB = async (
  payload: {
    donorType?: 'MEMBER' | 'GUEST';
    memberId?: number;
    donorName?: string;
    donorEmail?: string;
    contactPhone?: string;
    isAnonymous?: boolean;
    donorNote?: string;
    condition?: string;
    bookTitle: string;
    author?: string;
    category?: string;
    quantity?: number;
    autoCatalog?: boolean;
    locationCell?: string;
    isbn?: string;
    pages?: number;
  },
  shifterId: number
) => {
  const donorType = payload.donorType || 'GUEST';
  let donorId: number | null = null;
  let finalDonorName = payload.donorName?.trim() || 'Walk-in Donor';
  let finalDonorEmail = payload.donorEmail?.trim() || null;
  let finalContactPhone = payload.contactPhone?.trim() || null;

  if (donorType === 'MEMBER' && payload.memberId) {
    const member = await prisma.user.findUnique({
      where: { id: Number(payload.memberId) },
    });
    if (member) {
      donorId = member.id;
      finalDonorName = member.name;
      finalDonorEmail = member.email;
      finalContactPhone = member.phone || null;
    }
  }

  if (payload.isAnonymous) {
    finalDonorName = 'Anonymous Donor';
  }

  const quantity = payload.quantity && Number(payload.quantity) > 0 ? Number(payload.quantity) : 1;
  const bookTitle = payload.bookTitle.trim();
  const author = payload.author?.trim() || 'Unknown Author';
  const category = payload.category?.trim() || 'General';
  const autoCatalog = payload.autoCatalog !== false;

  const result = await prisma.$transaction(async (tx) => {
    let catalogedBookId: number | null = null;
    let donationStatus: DonationStatus = DonationStatus.RECEIVED;

    if (autoCatalog) {
      // Check if book already exists in catalog
      let existingBook = null;
      if (payload.isbn?.trim()) {
        existingBook = await tx.book.findUnique({
          where: { isbn: payload.isbn.trim() },
        });
      }

      if (!existingBook && bookTitle && bookTitle.toLowerCase() !== 'donated book') {
        if (author && author.toLowerCase() !== 'unknown author') {
          existingBook = await tx.book.findFirst({
            where: {
              title: { equals: bookTitle, mode: 'insensitive' },
              author: { equals: author, mode: 'insensitive' },
            },
          });
        }
        if (!existingBook) {
          existingBook = await tx.book.findFirst({
            where: {
              title: { equals: bookTitle, mode: 'insensitive' },
            },
          });
        }
      }

      if (existingBook) {
        catalogedBookId = existingBook.id;
        await tx.book.update({
          where: { id: existingBook.id },
          data: {
            borrowStock: { increment: quantity },
            ...(payload.locationCell?.trim() ? { locationCell: payload.locationCell.trim() } : {}),
          },
        });
      } else {
        const generatedIsbn =
          payload.isbn?.trim() || `DON-POS-${Date.now().toString().slice(-6)}`;
        const initialPages = payload.pages || 150;
        const initialLocation = payload.locationCell?.trim() || 'DONATION-DESK';

        const newBook = await tx.book.create({
          data: {
            title: bookTitle,
            author,
            isbn: generatedIsbn,
            locationCell: initialLocation,
            category,
            pages: initialPages,
            type: BookType.BORROW_ONLY,
            sellPrice: null,
            borrowStock: quantity,
            sellStock: 0,
            description:
              payload.donorNote ||
              `In-person donation received at POS Desk by staff. Condition: ${payload.condition || 'GOOD'}.`,
            addedById: shifterId,
            donatedById: donorId,
          },
        });
        catalogedBookId = newBook.id;
      }

      donationStatus = DonationStatus.APPROVED;
    }

    const donation = await tx.donation.create({
      data: {
        bookTitle,
        author,
        category,
        quantity,
        method: 'LIBRARY_DROP_OFF',
        isAnonymous: Boolean(payload.isAnonymous),
        donorName: finalDonorName,
        donorEmail: finalDonorEmail,
        contactPhone: finalContactPhone,
        donorNote: payload.donorNote || (payload.condition ? `Condition: ${payload.condition}` : null),
        donorId,
        receivedById: shifterId,
        receivedAt: new Date(),
        status: donationStatus,
        catalogedBookId,
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            studentOrVoterId: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        catalogedBook: true,
      },
    });

    return donation;
  });

  return result;
};

const deleteDonationInDB = async (donationId: number) => {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  });

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation record not found!');
  }

  return await prisma.donation.delete({
    where: { id: donationId },
  });
};

export const DonationService = {
  createDonationInDB,
  createPOSDonationInDB,
  approveDonationInDB,
  rejectDonationInDB,
  convertDonationToStock,
  getAllDonationsFromDB,
  deleteDonationInDB,
};

