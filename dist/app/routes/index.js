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
const contact_routes_1 = require("../modules/Contact/contact.routes");
const article_routes_1 = require("../modules/Article/article.routes");
const shifterSchedule_routes_1 = require("../modules/ShifterSchedule/shifterSchedule.routes");
const activity_routes_1 = require("../modules/Activity/activity.routes");
const event_routes_1 = require("../modules/Event/event.routes");
const eventSession_routes_1 = require("../modules/EventSession/eventSession.routes");
const eventMemberRecord_routes_1 = require("../modules/EventMemberRecord/eventMemberRecord.routes");
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
    {
        path: '/contact',
        route: contact_routes_1.ContactRoutes,
    },
    {
        path: '/articles',
        route: article_routes_1.ArticleRoutes,
    },
    {
        path: '/shifter-schedules',
        route: shifterSchedule_routes_1.ShifterScheduleRoutes,
    },
    {
        path: '/activities',
        route: activity_routes_1.ActivityRoutes,
    },
    {
        path: '/events',
        route: event_routes_1.EventRoutes,
    },
    {
        path: '/event-sessions',
        route: eventSession_routes_1.EventSessionRoutes,
    },
    {
        path: '/event-member-records',
        route: eventMemberRecord_routes_1.EventMemberRecordRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
