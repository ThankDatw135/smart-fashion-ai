import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

/**
 * Categories Controller
 * Public: GET /categories (cây danh mục)
 * Admin: CRUD /admin/categories
 */
@ApiTags('Categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ===========================================================================
  // PUBLIC — Lấy cây danh mục
  // ===========================================================================

  @Get('categories')
  @ApiOperation({ summary: 'Lấy cây danh mục (nested, cached)' })
  @ApiResponse({ status: 200, description: 'Trả về cây danh mục dạng nested' })
  async getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Lấy chi tiết danh mục theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục' })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findById(id);
  }

  // ===========================================================================
  // ADMIN — CRUD danh mục
  // ===========================================================================

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Tạo danh mục mới' })
  @ApiResponse({ status: 201, description: 'Danh mục đã tạo' })
  @ApiResponse({ status: 409, description: 'Slug đã tồn tại' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Cập nhật danh mục' })
  @ApiResponse({ status: 200, description: 'Danh mục đã cập nhật' })
  @ApiResponse({ status: 404, description: 'Danh mục không tồn tại' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: '[Admin] Xóa danh mục' })
  @ApiResponse({ status: 200, description: 'Danh mục đã xóa' })
  @ApiResponse({
    status: 400,
    description: 'Danh mục còn sản phẩm hoặc danh mục con',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
