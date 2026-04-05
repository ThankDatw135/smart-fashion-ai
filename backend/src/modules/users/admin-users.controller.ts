import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UsersService } from './users.service.js';

/**
 * Admin Users Controller — Prefix: /api/v1/admin/users
 * H6 fix: Frontend admin panel cần endpoint để list và quản lý users
 */
@ApiTags('Admin Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth('JWT-Auth')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin — Lấy danh sách tất cả users' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['user', 'admin', 'super_admin'],
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'BANNED'] })
  @ApiResponse({ status: 200, description: 'Danh sách users' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      role,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin — Xem chi tiết user' })
  @ApiResponse({ status: 200, description: 'Chi tiết user' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin — Cập nhật user (role, status, etc.)' })
  @ApiResponse({ status: 200, description: 'User đã cập nhật' })
  async updateUser(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.usersService.updateProfile(id, dto);
  }
}
