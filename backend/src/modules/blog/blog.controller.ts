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
  Req,
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
import { BlogService } from './blog.service.js';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  CreateBlogCategoryDto,
  UpdateBlogCategoryDto,
} from './dto/index.js';

// Ghi chú: Interface cho request khi có user
interface AuthenticatedRequest {
  user: { id: string; role: string };
}

// =============================================================================
// ADMIN — BÀI VIẾT BLOG
// =============================================================================

@ApiTags('Admin Blog')
@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo bài viết blog (Admin)' })
  create(
    @Body() dto: CreateBlogPostDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.blogService.createPost(dto, req.user.id, thumbnail);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bài viết (Admin)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published'],
  })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'draft' | 'published',
    @Query('categoryId') categoryId?: string,
  ) {
    return this.blogService.findAllAdmin({
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      categoryId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bài viết (Admin)' })
  findOne(@Param('id') id: string) {
    return this.blogService.findOneAdmin(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật bài viết (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    return this.blogService.updatePost(id, dto, thumbnail);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết (Admin)' })
  delete(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }
}

// =============================================================================
// ADMIN — DANH MỤC BLOG
// =============================================================================

@ApiTags('Admin Blog Categories')
@Controller('admin/blog-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AdminBlogCategoryController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo danh mục blog (Admin)' })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục blog (Admin)' })
  findAll() {
    return this.blogService.findAllCategories();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục blog (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục blog (Admin)' })
  delete(@Param('id') id: string) {
    return this.blogService.deleteCategory(id);
  }
}

// =============================================================================
// PUBLIC — BLOG LISTING
// =============================================================================

@ApiTags('Blog')
@Controller('blog')
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bài viết (Public)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('category') categorySlug?: string,
  ) {
    return this.blogService.findAllPublic({
      cursor,
      limit: limit ? parseInt(limit, 10) : 12,
      categorySlug,
    });
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Chi tiết bài viết theo slug (Public)',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
