"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = require("../modules/Auth/auth.routes");
const user_routes_1 = require("../modules/User/user.routes");
const book_routes_1 = require("../modules/Book/book.routes");
const borrow_routes_1 = require("../modules/Borrow/borrow.routes");
const purchase_routes_1 = require("../modules/Purchase/purchase.routes");
const payment_routes_1 = require("../modules/Payment/payment.routes");
const donation_routes_1 = require("../modules/Donation/donation.routes");
const shiftLog_routes_1 = require("../modules/ShiftLog/shiftLog.routes");
const review_routes_1 = require("../modules/Review/review.routes");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/auth',
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: '/users',
        route: user_routes_1.UserRoutes,
    },
    {
        path: '/books',
        route: book_routes_1.BookRoutes,
    },
    {
        path: '/borrows',
        route: borrow_routes_1.BorrowRoutes,
    },
    {
        path: '/purchases',
        route: purchase_routes_1.PurchaseRoutes,
    },
    {
        path: '/payments',
        route: payment_routes_1.PaymentRoutes,
    },
    {
        path: '/donations',
        route: donation_routes_1.DonationRoutes,
    },
    {
        path: '/shift-logs',
        route: shiftLog_routes_1.ShiftLogRoutes,
    },
    {
        path: '/reviews',
        route: review_routes_1.ReviewRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
