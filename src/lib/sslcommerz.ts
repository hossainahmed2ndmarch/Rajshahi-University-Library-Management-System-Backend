import config from '../app/config';

export interface ISSLCommerzInitPayment {
  total_amount: number;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  product_name: string;
  product_category?: string;
  value_a?: string;
  value_b?: string;
}

export interface ISSLCommerzResponse {
  status: string;
  GatewayPageURL?: string;
  failedreason?: string;
  sessionkey?: string;
}

export interface ISSLCommerzValidationResponse {
  status: string;
  val_id: string;
  amount: string;
  tran_id: string;
  card_type?: string;
  store_amount?: string;
  bank_tran_id?: string;
  card_issuer?: string;
  card_brand?: string;
  value_a?: string;
  value_b?: string;
  error?: string;
}

export const sslcommerz = {
  init: async (data: ISSLCommerzInitPayment): Promise<ISSLCommerzResponse> => {
    const isLive = config.sslcommerz.is_live;
    const storeId = config.sslcommerz.store_id;
    const storePasswd = config.sslcommerz.store_passwd;
    const paymentApi =
      config.sslcommerz.ssl_payment_api ||
      (isLive
        ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php');

    const params = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePasswd,
      total_amount: data.total_amount.toString(),
      currency: 'BDT',
      tran_id: data.tran_id,
      success_url: data.success_url,
      fail_url: data.fail_url,
      cancel_url: data.cancel_url,
      ipn_url: data.ipn_url || data.success_url,
      cus_name: data.cus_name,
      cus_email: data.cus_email,
      cus_add1: data.cus_add1,
      cus_phone: data.cus_phone,
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: data.product_name,
      product_category: data.product_category || 'Library',
      product_profile: 'general',
    });

    if (data.value_a) params.append('value_a', data.value_a);
    if (data.value_b) params.append('value_b', data.value_b);

    const response = await fetch(paymentApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = (await response.json()) as ISSLCommerzResponse;
    return result;
  },

  validate: async (val_id: string): Promise<ISSLCommerzValidationResponse> => {
    const isLive = config.sslcommerz.is_live;
    const storeId = config.sslcommerz.store_id;
    const storePasswd = config.sslcommerz.store_passwd;
    const validationApi =
      config.sslcommerz.ssl_validation_api ||
      (isLive
        ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php');

    const url = `${validationApi}?val_id=${val_id}&store_id=${storeId}&store_passwd=${storePasswd}&format=json`;

    const response = await fetch(url);
    const result = (await response.json()) as ISSLCommerzValidationResponse;
    return result;
  },
};

export default sslcommerz;
