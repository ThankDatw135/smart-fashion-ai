import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO xác minh email — OTP 6 chữ số
 */
export class VerifyEmailDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 chữ số' })
  @IsString()
  @Length(6, 6, { message: 'OTP phải đúng 6 chữ số' })
  otp!: string;
}
