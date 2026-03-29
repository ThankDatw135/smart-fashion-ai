import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO đổi mật khẩu — yêu cầu mật khẩu hiện tại + mật khẩu mới
 */
export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString()
  @MinLength(1, { message: 'Mật khẩu hiện tại không được để trống' })
  currentPassword!: string;

  @ApiProperty({
    description: 'Mật khẩu mới (≥8 ký tự, chữ hoa + thường + số)',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu mới tối đa 72 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  newPassword!: string;
}
