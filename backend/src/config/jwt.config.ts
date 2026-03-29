import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// Cấu hình JWT RS256 — đọc key pair từ file system
export default registerAs('jwt', () => {
  const privateKeyPath = path.resolve(
    process.env.JWT_PRIVATE_KEY_PATH || 'keys/private.pem',
  );
  const publicKeyPath = path.resolve(
    process.env.JWT_PUBLIC_KEY_PATH || 'keys/public.pem',
  );

  // Chỉ đọc key khi file tồn tại (không bắt buộc ở phase này)
  const privateKey = fs.existsSync(privateKeyPath)
    ? fs.readFileSync(privateKeyPath, 'utf-8')
    : '';
  const publicKey = fs.existsSync(publicKeyPath)
    ? fs.readFileSync(publicKeyPath, 'utf-8')
    : '';

  return {
    privateKey,
    publicKey,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  };
});
