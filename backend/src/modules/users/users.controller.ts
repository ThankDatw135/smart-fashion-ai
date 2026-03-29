import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto, ChangePasswordDto } from './dto/index.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Users Controller — Prefix: /api/v1/users
 * Quản lý hồ sơ cá nhân, avatar, đổi mật khẩu
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ cá nhân chi tiết' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user (không bao gồm password)',
  })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân (tên, SĐT)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Đổi mật khẩu (cần mật khẩu hiện tại)' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Patch('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar mới' })
  @ApiResponse({ status: 200, description: 'Avatar đã cập nhật' })
  async updateAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Ghi chú: Ở Phase hiện tại, lưu local. Production sẽ upload Cloudinary
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(userId, avatarUrl);
  }
}
