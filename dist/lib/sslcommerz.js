"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sslcommerz = void 0;
const config_1 = __importDefault(require("../app/config"));
exports.sslcommerz = {
    init: (data) => __awaiter(void 0, void 0, void 0, function* () {
        const isLive = config_1.default.sslcommerz.is_live;
        const storeId = config_1.default.sslcommerz.store_id;
        const storePasswd = config_1.default.sslcommerz.store_passwd;
        const paymentApi = config_1.default.sslcommerz.ssl_payment_api ||
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
        if (data.value_a)
            params.append('value_a', data.value_a);
        if (data.value_b)
            params.append('value_b', data.value_b);
        const response = yield fetch(paymentApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        const result = (yield response.json());
        return result;
    }),
    validate: (val_id) => __awaiter(void 0, void 0, void 0, function* () {
        const isLive = config_1.default.sslcommerz.is_live;
        const storeId = config_1.default.sslcommerz.store_id;
        const storePasswd = config_1.default.sslcommerz.store_passwd;
        const validationApi = config_1.default.sslcommerz.ssl_validation_api ||
            (isLive
                ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
                : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php');
        const url = `${validationApi}?val_id=${val_id}&store_id=${storeId}&store_passwd=${storePasswd}&format=json`;
        const response = yield fetch(url);
        const result = (yield response.json());
        return result;
    }),
};
exports.default = exports.sslcommerz;
