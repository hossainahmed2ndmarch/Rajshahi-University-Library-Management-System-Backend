/**
 * bKash Payment Integration (Tokenized Checkout API v1.2.0-beta)
 * 
 * Supports:
 * 1. Personal Send Money Manual Flow (Account: 01601704112 / +880 1601-704112)
 * 2. bKash Merchant Tokenized Online Checkout API (Sandbox / Live)
 */

interface TBkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

interface TBkashCreatePaymentPayload {
  amount: number;
  invoiceNumber: string;
  payerReference?: string;
  callbackUrl?: string;
}

interface TBkashCreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  bkashURL?: string;
  callbackURL?: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  amount?: string;
  intent?: string;
  currency?: string;
  paymentCreateTime?: string;
  transactionStatus?: string;
  merchantInvoiceNumber?: string;
}

interface TBkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  paymentExecuteTime?: string;
  merchantInvoiceNumber?: string;
  payerReference?: string;
  customerMsisdn?: string;
}

let cachedIdToken: string | null = null;
let tokenExpiresAt: number = 0;

export const BKASH_PERSONAL_ACCOUNT =
  process.env.BKASH_PERSONAL_NUMBER || '01601704112';

const isSandbox =
  (process.env.BKASH_IS_SANDBOX || 'true').toLowerCase() === 'true';

const BASE_URL = isSandbox
  ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

export const isBkashMerchantConfigured = (): boolean => {
  return Boolean(
    process.env.BKASH_APP_KEY &&
      process.env.BKASH_APP_SECRET &&
      process.env.BKASH_USERNAME &&
      process.env.BKASH_PASSWORD
  );
};

/**
 * Grants or retrieves a valid tokenized bKash session token
 */
export const grantBkashToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedIdToken && tokenExpiresAt > now + 60000) {
    return cachedIdToken;
  }

  if (!isBkashMerchantConfigured()) {
    console.warn(
      '⚠️ [bKash Merchant] API credentials not configured in .env. Returning simulated token.'
    );
    cachedIdToken = `SIMULATED_BKASH_TOKEN_${Date.now()}`;
    tokenExpiresAt = now + 3600 * 1000;
    return cachedIdToken;
  }

  try {
    const response = await fetch(`${BASE_URL}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username: process.env.BKASH_USERNAME!,
        password: process.env.BKASH_PASSWORD!,
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY!,
        app_secret: process.env.BKASH_APP_SECRET!,
      }),
    });

    const data = (await response.json()) as TBkashTokenResponse;

    if (data.id_token) {
      cachedIdToken = data.id_token;
      tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
      return cachedIdToken;
    } else {
      throw new Error(data.statusMessage || 'Failed to grant bKash token');
    }
  } catch (error) {
    console.error('❌ [bKash Token Error]:', error);
    throw error;
  }
};

/**
 * Creates a bKash Checkout URL for customer redirection
 */
export const createBkashPayment = async (
  payload: TBkashCreatePaymentPayload
): Promise<TBkashCreatePaymentResponse> => {
  if (!isBkashMerchantConfigured()) {
    const simPaymentId = `BK_SIM_${Date.now()}`;
    const defaultCallback =
      payload.callbackUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/bkash/callback`;

    return {
      statusCode: '0000',
      statusMessage: 'Simulated Merchant Payment Session Created',
      paymentID: simPaymentId,
      bkashURL: `${defaultCallback}?paymentID=${simPaymentId}&status=success`,
      amount: payload.amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: payload.invoiceNumber,
    };
  }

  const token = await grantBkashToken();
  const callbackUrl =
    payload.callbackUrl ||
    process.env.BKASH_CALLBACK_URL ||
    `${process.env.BACKEND_URL || 'http://localhost:5000/api/v1'}/bkash/callback`;

  const requestBody = {
    mode: '0011',
    payerReference: payload.payerReference || 'RUIL_PATRON',
    callbackURL: callbackUrl,
    amount: payload.amount.toFixed(2),
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: payload.invoiceNumber,
  };

  const response = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as TBkashCreatePaymentResponse;
  return data;
};

/**
 * Executes a bKash payment after customer confirms with PIN on gateway
 */
export const executeBkashPayment = async (
  paymentID: string
): Promise<TBkashExecutePaymentResponse> => {
  if (!isBkashMerchantConfigured() || paymentID.startsWith('BK_SIM_')) {
    return {
      statusCode: '0000',
      statusMessage: 'Successful',
      paymentID,
      trxID: `TRX_SIM_${Date.now()}`,
      transactionStatus: 'Completed',
      amount: '500.00',
      currency: 'BDT',
      intent: 'sale',
      paymentExecuteTime: new Date().toISOString(),
    };
  }

  const token = await grantBkashToken();

  const response = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = (await response.json()) as TBkashExecutePaymentResponse;
  return data;
};

/**
 * Queries payment status from bKash server
 */
export const queryBkashPayment = async (paymentID: string) => {
  if (!isBkashMerchantConfigured() || paymentID.startsWith('BK_SIM_')) {
    return {
      statusCode: '0000',
      statusMessage: 'Completed',
      paymentID,
      transactionStatus: 'Completed',
    };
  }

  const token = await grantBkashToken();

  const response = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-APP-Key': process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID }),
  });

  return await response.json();
};
