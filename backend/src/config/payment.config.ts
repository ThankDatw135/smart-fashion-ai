import { registerAs } from '@nestjs/config';

/**
 * Cấu hình thanh toán chuyển khoản ngân hàng (VCB Digibank + VietQR)
 *
 * Luồng thanh toán:
 * 1. Khách đặt hàng → Backend generate QR URL qua VietQR API (có sẵn số tiền + nội dung CK)
 * 2. Khách mở app VCB Digibank → Quét QR → Mọi thông tin đã điền sẵn → Bấm xác nhận
 * 3. Admin kiểm tra sao kê → Xác nhận đã nhận tiền → Cập nhật trạng thái đơn hàng
 *
 * VietQR API (miễn phí, không cần đăng ký):
 * https://img.vietqr.io/image/{bankBin}-{accountNumber}-qr_only.png
 *   ?amount={soTien}&addInfo={noiDungCK}&accountName={tenChuTK}
 */
export default registerAs('payment', () => ({
  // Thông tin ngân hàng
  bankName: process.env.BANK_NAME || 'Vietcombank',
  bankCode: process.env.BANK_CODE || 'VCB',
  bankBin: process.env.BANK_BIN || '970436', // Mã BIN VCB theo NAPAS
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
  accountName: process.env.BANK_ACCOUNT_NAME || '',
  branch: process.env.BANK_BRANCH || '',

  // Template nội dung chuyển khoản — {orderNumber} sẽ được thay bằng mã đơn hàng
  transferTemplate: process.env.BANK_TRANSFER_TEMPLATE || 'SF {orderNumber}',

  // VietQR API endpoint — dùng để generate ảnh QR tự động
  vietQrBaseUrl: 'https://img.vietqr.io/image',
}));
