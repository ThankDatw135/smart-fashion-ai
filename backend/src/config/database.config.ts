import { registerAs } from '@nestjs/config';

// Cấu hình kết nối PostgreSQL — sử dụng DATABASE_URL từ Prisma
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://smartfashion:smartfashion_secret@localhost:5432/smartfashion_db?schema=public',
}));
