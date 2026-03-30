import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { BannersService } from './banners.service.js';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerPosition,
} from './dto/index.js';

// =============================================================================
// ADMIN — BANNER MANAGEMENT
// =============================================================================

@ApiTags('Admin Banners')
@Controller('admin/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo banner (Admin)' })
  create(
    @Body() dto: CreateBannerDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.bannersService.create(dto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách banner (Admin)' })
  @ApiQuery({
    name: 'position',
    required: false,
    enum: BannerPosition,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
  })
  findAll(
    @Query('position') position?: BannerPosition,
    @Query('isActive') isActive?: string,
  ) {
    return this.bannersService.findAllAdmin({
      position,
      isActive: isActive !== undefined
        ? isActive === 'true'
        : undefined,
    });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật banner (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.bannersService.update(id, dto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner (Admin)' })
  delete(@Param('id') id: string) {
    return this.bannersService.delete(id);
  }
}

// =============================================================================
// PUBLIC — ACTIVE BANNERS
// =============================================================================

@ApiTags('Banners')
@Controller('banners')
export class PublicBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy banner active (Public, cache 10 phút)',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    enum: BannerPosition,
  })
  findActive(@Query('position') position?: BannerPosition) {
    return this.bannersService.findActivePublic(position);
  }
}
