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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

/**
 * Tags Controller — Admin CRUD tag labels
 */
@ApiTags('Tags')
@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth('JWT-Auth')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Lấy tất cả tags' })
  async findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Tạo tag mới' })
  async create(@Body() data: { name: string; color?: string }) {
    return this.tagsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Cập nhật tag' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; color?: string },
  ) {
    return this.tagsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Xóa tag' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
