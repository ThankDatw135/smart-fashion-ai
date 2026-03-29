import {
  IsEmail,
  IsString,
  Length,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO yêu cầu quên mật khẩu — gửi OTP tới email
 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;
}

/**
 * DTO xác minh OTP quên mật khẩu — trả về reset token
 */
export class VerifyOtpDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: '654321', description: 'Mã OTP 6 chữ số' })
  @IsString()
  @Length(6, 6, { message: 'OTP phải đúng 6 chữ số' })
  otp!: string;
}

/**
 * DTO đặt lại mật khẩu — cần resetToken + mật khẩu mới
 */
export class ResetPasswordDto {
  @ApiProperty({ description: 'Token xác minh quên mật khẩu' })
  @IsString()
  resetToken!: string;

  @ApiProperty({ example: 'NewPassword123', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  newPassword!: string;
}
