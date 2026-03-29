import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Cost factor cao = an toàn hơn nhưng chậm hơn

/**
 * Hash mật khẩu — dùng Bcrypt với salt rounds = 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * So sánh mật khẩu plain text với hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
