import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO đăng nhập — email + mật khẩu
 */
export class LoginDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'MyPassword123' })
  @IsString()
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password!: string;
}
