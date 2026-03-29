import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Custom decorator @CurrentUser() — trích xuất user từ JWT request
 * Sử dụng: @CurrentUser() user: JwtPayload
 * Hoặc: @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
