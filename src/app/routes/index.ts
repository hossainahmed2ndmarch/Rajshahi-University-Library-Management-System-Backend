import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { UserRoutes } from '../modules/User/user.routes';
import { BookRoutes } from '../modules/Book/book.routes';
import { BorrowRoutes } from '../modules/Borrow/borrow.routes';
import { PurchaseRoutes } from '../modules/Purchase/purchase.routes';
import { PaymentRoutes } from '../modules/Payment/payment.routes';
import { DonationRoutes } from '../modules/Donation/donation.routes';
import { ShiftLogRoutes } from '../modules/ShiftLog/shiftLog.routes';
import { ReviewRoutes } from '../modules/Review/review.routes';
import { ContactRoutes } from '../modules/Contact/contact.routes';

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/books',
    route: BookRoutes,
  },
  {
    path: '/borrows',
    route: BorrowRoutes,
  },
  {
    path: '/purchases',
    route: PurchaseRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/donations',
    route: DonationRoutes,
  },
  {
    path: '/shift-logs',
    route: ShiftLogRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/contact',
    route: ContactRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
