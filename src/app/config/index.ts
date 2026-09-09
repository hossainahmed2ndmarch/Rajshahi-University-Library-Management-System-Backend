import dotenvx from '@dotenvx/dotenvx';
import path from 'path';

dotenvx.config({ path: path.join(process.cwd(), '.env') });
// Hello 
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  client_url: process.env.CLIENT_URL || 'http://localhost:3000',
  backend_url: process.env.BACKEND_URL || 'http://localhost:5000/api/v1',
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    jwt_secret: process.env.JWT_SECRET || 'secret',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '30d',
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET || 'refresh_secret',
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN || '365d',
    reset_pass_secret: process.env.RESET_PASS_SECRET || 'reset_secret',
    reset_pass_expires_in: process.env.RESET_PASS_EXPIRES_IN || '5m',
  },
  sslcommerz: {
    store_id: process.env.STORE_ID || '',
    store_passwd: process.env.STORE_PASSWD || '',
    is_live: process.env.IS_LIVE === 'true',
    ssl_payment_api: process.env.SSL_PAYMENT_API || '',
    ssl_validation_api: process.env.SSL_VALIDATION_API || '',
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'RU Islamic Library <no-reply@ruislamiclib.org>',
  },
};

export default config;
