import { registerAs } from '@nestjs/config';

// Cấu hình ứng dụng chính
export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'SmartFashionAI',
  port: parseInt(process.env.APP_PORT || '4000', 10),
  env: process.env.APP_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: parseInt(process.env.API_VERSION || '1', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
