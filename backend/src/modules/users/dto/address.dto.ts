import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'Họ tên người nhận', example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0987654321' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phone!: string;

  @ApiProperty({ description: 'Tỉnh/Thành phố', example: 'Hà Nội' })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  province!: string;

  @ApiProperty({ description: 'Quận/Huyện', example: 'Cầu Giấy' })
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString()
  district!: string;

  @ApiProperty({ description: 'Phường/Xã', example: 'Dịch Vọng' })
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  ward!: string;

  @ApiProperty({
    description: 'Địa chỉ cụ thể (Số nhà, đường...)',
    example: 'Số 1, ngõ 2, đường 3',
  })
  @IsNotEmpty({ message: 'Địa chỉ cụ thể không được để trống' })
  @IsString()
  @MaxLength(255)
  addressDetail!: string;

  @ApiProperty({
    description: 'Đặt làm địa chỉ mặc định',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
