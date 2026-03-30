import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ReturnsService } from './returns.service.js';
import { CreateReturnDto, ProcessReturnDto } from './dto/index.js';

// Ghi chú: Interface cho request khi có user
interface AuthenticatedRequest {
  user: { id: string; role: string };
}

// =============================================================================
// USER — YÊU CẦU ĐỔI/TRẢ
// =============================================================================

@ApiTags('Returns')
@Controller('returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu đổi/trả hàng (User)' })
  create(@Body() dto: CreateReturnDto, @Req() req: AuthenticatedRequest) {
    return this.returnsService.createReturn(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách yêu cầu đổi/trả của tôi (User)' })
  findMine(@Req() req: AuthenticatedRequest) {
    return this.returnsService.findUserReturns(req.user.id);
  }
}

// =============================================================================
// ADMIN — QUẢN LÝ ĐỔI/TRẢ
// =============================================================================

@ApiTags('Admin Returns')
@Controller('admin/returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách yêu cầu đổi/trả (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'completed'] })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.returnsService.findAllAdmin({
      status,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết yêu cầu đổi/trả (Admin)' })
  findOne(@Param('id') id: string) {
    return this.returnsService.findOneAdmin(id);
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Duyệt/từ chối yêu cầu đổi/trả (Admin)' })
  process(
    @Param('id') id: string,
    @Body() dto: ProcessReturnDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.returnsService.processReturn(id, req.user.id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Hoàn tất yêu cầu đổi/trả — restore stock (Admin)' })
  complete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.returnsService.completeReturn(id, req.user.id);
  }
}
