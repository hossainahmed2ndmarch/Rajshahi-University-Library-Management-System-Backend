
export interface ISteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface ISteadfastOrderResponse {
  status: number;
  message: string;
  consignment?: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
  };
}

export interface ISteadfastTrackingResponse {
  status: number;
  delivery_status: string;
}

const STEADFAST_BASE_URL =
  process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.courier/api/v1';
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY || '';
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY || '';

/**
 * Creates a parcel delivery shipment via Steadfast Courier REST API
 */
export const createSteadfastOrder = async (
  payload: ISteadfastOrderPayload
): Promise<ISteadfastOrderResponse> => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    // If API credentials not configured yet, return mock consignment for development
    console.warn(
      '⚠️ STEADFAST_API_KEY / STEADFAST_SECRET_KEY not set in .env. Returning simulated consignment.'
    );
    return {
      status: 200,
      message: 'Simulated Steadfast order created (credentials not set)',
      consignment: {
        consignment_id: Math.floor(100000 + Math.random() * 900000),
        invoice: payload.invoice,
        tracking_code: `STDF-${Date.now().toString().slice(-6)}`,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        cod_amount: payload.cod_amount,
        status: 'in_review',
      },
    };
  }

  const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
    method: 'POST',
    headers: {
      'Api-Key': STEADFAST_API_KEY,
      'Secret-Key': STEADFAST_SECRET_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as ISteadfastOrderResponse;
};

/**
 * Checks real-time parcel delivery status from Steadfast Courier
 */
export const checkSteadfastTracking = async (
  trackingCode: string
): Promise<ISteadfastTrackingResponse | null> => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    return {
      status: 200,
      delivery_status: 'in_review',
    };
  }

  try {
    const response = await fetch(
      `${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
      {
        method: 'GET',
        headers: {
          'Api-Key': STEADFAST_API_KEY,
          'Secret-Key': STEADFAST_SECRET_KEY,
        },
      }
    );
    return (await response.json()) as ISteadfastTrackingResponse;
  } catch (error) {
    console.error('Failed to fetch Steadfast tracking status:', error);
    return null;
  }
};
