import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO đăng ký tài khoản — validate dữ liệu trước khi tạo user
 * Mật khẩu yêu cầu: ≥8 ký tự, có chữ hoa, chữ thường, số
 */
export class RegisterDto {
  @ApiProperty({
    example: 'nguyenvana@gmail.com',
    description: 'Email đăng ký',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({
    example: 'MyPassword123',
    description: 'Mật khẩu (≥8 ký tự, chữ hoa + thường + số)',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
  fullName!: string;

  @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}
