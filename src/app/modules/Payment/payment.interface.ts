export type TSSLCommerzIPN = {
  tran_id?: string;
  val_id?: string;
  amount?: string;
  card_type?: string;
  store_amount?: string;
  bank_tran_id?: string;
  status?: 'VALID' | 'VALIDATED' | 'INVALID' | 'FAILED' | 'CANCELLED' | string;
  tran_date?: string;
  currency?: string;
  card_issuer?: string;
  card_brand?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
};

export type TInitiatePaymentPayload = {
  amount?: number;
};
