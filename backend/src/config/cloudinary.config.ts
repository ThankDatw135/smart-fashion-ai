import { registerAs } from '@nestjs/config';

// Cấu hình Cloudinary — lưu ảnh production, dev dùng local
export default registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadDriver: process.env.UPLOAD_DRIVER || 'local', // 'local' | 'cloudinary'
}));
