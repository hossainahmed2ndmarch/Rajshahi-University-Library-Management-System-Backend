import { Router } from 'express';
import { BkashController } from './bkash.controller';

const router = Router();

// Public: Get bKash payment information & personal number
router.get('/info', BkashController.getBkashInfo);

// Submit Personal bKash transaction (Sender Phone + TrxID)
router.post('/submit-personal', BkashController.submitPersonalPayment);

// Initialize bKash Tokenized payment session
router.post('/create-payment', BkashController.initiatePayment);

// Execute & complete payment callback
router.post('/execute-payment', BkashController.completePayment);

export const BkashRoutes = router;
