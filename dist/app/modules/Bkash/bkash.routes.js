"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BkashRoutes = void 0;
const express_1 = require("express");
const bkash_controller_1 = require("./bkash.controller");
const router = (0, express_1.Router)();
// Public: Get bKash payment information & personal number
router.get('/info', bkash_controller_1.BkashController.getBkashInfo);
// Submit Personal bKash transaction (Sender Phone + TrxID)
router.post('/submit-personal', bkash_controller_1.BkashController.submitPersonalPayment);
// Initialize bKash Tokenized payment session
router.post('/create-payment', bkash_controller_1.BkashController.initiatePayment);
// Execute & complete payment callback
router.post('/execute-payment', bkash_controller_1.BkashController.completePayment);
exports.BkashRoutes = router;
