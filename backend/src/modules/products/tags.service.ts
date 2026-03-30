import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Tags Service — CRUD tag labels cho sản phẩm
 */
@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy tất cả tags
   */
  async findAll() {
    return this.prisma.productTag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Tạo tag mới
   */
  async create(data: { name: string; color?: string }) {
    // Kiểm tra trùng tên
    const existing = await this.prisma.productTag.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Tag đã tồn tại');
    }

    const tag = await this.prisma.productTag.create({ data });
    this.logger.log(`Tag đã tạo: ${tag.name}`);
    return tag;
  }

  /**
   * Cập nhật tag
   */
  async update(id: string, data: { name?: string; color?: string }) {
    const existing = await this.prisma.productTag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tag không tồn tại');

    // Kiểm tra trùng tên nếu đổi
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.productTag.findUnique({
        where: { name: data.name },
      });
      if (duplicate) throw new ConflictException('Tag đã tồn tại');
    }

    return this.prisma.productTag.update({ where: { id }, data });
  }

  /**
   * Xóa tag — cascade xóa product_tag_map
   */
  async remove(id: string) {
    const existing = await this.prisma.productTag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tag không tồn tại');

    await this.prisma.productTag.delete({ where: { id } });
    this.logger.log(`Tag đã xóa: ${existing.name}`);
    return { message: `Đã xóa tag: ${existing.name}` };
  }
}
