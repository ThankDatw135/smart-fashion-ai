import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto, ChangePasswordDto } from './dto/index.js';
import * as ErrorCodes from '../../common/constants/error-codes.js';

const BCRYPT_ROUNDS = 12;

/**
 * Users Service — quản lý hồ sơ cá nhân, avatar, đổi mật khẩu
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin chi tiết user (không trả passwordHash)
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        vipTier: true,
        totalSpent: true,
        emailVerified: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Cập nhật hồ sơ cá nhân (fullName, phone)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        vipTier: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated: ${userId}`);
    return user;
  }

  /**
   * Đổi mật khẩu — kiểm tra mật khẩu cũ trước khi đổi
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    // 1. Lấy passwordHash hiện tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'Tài khoản này đăng nhập bằng Google, không thể đổi mật khẩu.',
      );
    }

    // 2. Verify mật khẩu cũ
    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // 3. Hash mật khẩu mới + cập nhật
    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    this.logger.log(`Password changed: ${userId}`);
    return { message: 'Đổi mật khẩu thành công.' };
  }

  /**
   * Cập nhật avatar URL (file đã upload ở controller)
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    this.logger.log(`Avatar updated: ${userId}`);
    return user;
  }
}
