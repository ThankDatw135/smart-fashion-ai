import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/index.js';
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
   * H6: Admin — Lấy danh sách users (paginated + filter)
   */
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

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

  // ===========================================================================
  // MODULE: USER ADDRESS
  // ===========================================================================

  async getAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // Nếu đây là địa chỉ đầu tiên hoặc được set là default, xử lý cờ isDefault
    let isDefault = dto.isDefault || false;

    const existingCount = await this.prisma.userAddress.count({
      where: { userId },
    });
    if (existingCount === 0) {
      isDefault = true;
    } else if (isDefault) {
      // Bỏ default của các địa chỉ cũ
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.userAddress.create({
      data: {
        userId,
        ...dto,
        isDefault,
      },
    });

    this.logger.log(`Address created for user: ${userId}`);
    return address;
  }

  async updateAddress(
    addressId: string,
    userId: string,
    dto: UpdateAddressDto,
  ) {
    // Kiểm tra tồn tại
    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.userAddress.update({
      where: { id: addressId },
      data: dto,
    });

    return address;
  }

  async deleteAddress(addressId: string, userId: string) {
    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    if (existing.isDefault) {
      // Gán một cái khác làm default nếu còn
      const another = await this.prisma.userAddress.findFirst({
        where: { userId, id: { not: addressId } },
      });
      if (another) {
        await this.prisma.userAddress.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.userAddress.delete({ where: { id: addressId } });
    this.logger.log(`Address deleted: ${addressId}`);
    return { message: 'Xoá địa chỉ thành công' };
  }

  async setDefaultAddress(addressId: string, userId: string) {
    const existing = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { message: 'Đã đặt làm địa chỉ mặc định' };
  }
}
