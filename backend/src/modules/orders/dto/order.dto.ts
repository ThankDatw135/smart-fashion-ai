import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO khởi tạo checkout session
 */
export class InitCheckoutDto {
  @ApiProperty({
    description: 'Danh sách Cart Item IDs người dùng đã chọn',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  cartItemIds!: string[];

  @ApiPropertyOptional({ description: 'Guest ID (nếu chưa login)' })
  @IsOptional()
  @IsString()
  guestId?: string;
}

/**
 * DTO cập nhật địa chỉ giao hàng cho checkout
 */
export class CheckoutAddressDto {
  @ApiProperty({ description: 'Họ tên người nhận', example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0912345678' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
    message: 'Số điện thoại không hợp lệ (VN)',
  })
  phone!: string;

  @ApiProperty({ description: 'Tỉnh/Thành phố', example: 'Hồ Chí Minh' })
  @IsString()
  @MaxLength(100)
  province!: string;

  @ApiProperty({ description: 'Quận/Huyện', example: 'Quận 1' })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiProperty({ description: 'Phường/Xã', example: 'Phường Bến Nghé' })
  @IsString()
  @MaxLength(100)
  ward!: string;

  @ApiProperty({
    description: 'Địa chỉ chi tiết',
    example: '123 Nguyễn Huệ, Quận 1',
  })
  @IsString()
  @MaxLength(255)
  addressDetail!: string;

  @ApiPropertyOptional({
    description: 'Lưu làm địa chỉ mặc định',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveAsDefault?: boolean;
}

/**
 * DTO áp dụng voucher cho checkout
 */
export class ApplyVoucherDto {
  @ApiProperty({ description: 'Mã voucher', example: 'SALE10' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  voucherCode!: string;
}

/**
 * DTO xác nhận checkout → tạo đơn hàng
 */
export enum PaymentMethodEnum {
  COD = 'cod',
  MOMO = 'momo',
  BANK_TRANSFER = 'bank_transfer',
}

export class ConfirmCheckoutDto {
  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.COD,
  })
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;

  @ApiPropertyOptional({ description: 'Ghi chú đơn hàng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * DTO filter đơn hàng admin
 */
export class OrderFilterDto {
  @ApiPropertyOptional({ description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Tìm theo orderNumber hoặc tên' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Cursor phân trang' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Số lượng mỗi trang',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * DTO cập nhật trạng thái đơn hàng (Admin)
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới',
    example: 'confirmed',
  })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Ghi chú khi đổi trạng thái' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
