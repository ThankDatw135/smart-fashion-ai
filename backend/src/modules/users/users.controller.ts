import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
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
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/index.js';

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

  // ===========================================================================
  // MODULE: USER ADDRESS
  // ===========================================================================

  @Get('me/addresses')
  @ApiOperation({ summary: 'Lấy danh sách sổ địa chỉ của user' })
  @ApiResponse({ status: 200, description: 'Danh sách địa chỉ' })
  async getAddresses(@CurrentUser('sub') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  @ApiResponse({ status: 201, description: 'Đã thêm địa chỉ' })
  async createAddress(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(userId, dto);
  }

  @Put('me/addresses/:id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật địa chỉ' })
  async updateAddress(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(id, userId, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  @ApiResponse({ status: 200, description: 'Đã xóa địa chỉ' })
  async deleteAddress(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.deleteAddress(id, userId);
  }

  @Patch('me/addresses/:id/default')
  @ApiOperation({ summary: 'Đặt làm địa chỉ mặc định' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async setDefaultAddress(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.setDefaultAddress(id, userId);
  }
}
