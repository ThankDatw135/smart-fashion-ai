import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';
import { CaslAbilityFactory } from './casl-ability.factory.js';

/**
 * Auth Module — đăng ký strategies, guards, và service
 * Provider toàn bộ cơ sở hạ tầng xác thực cho ứng dụng
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.registerQueue({ name: QUEUE_NAMES.MAIL }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    RolesGuard,
    CaslAbilityFactory,
  ],
  exports: [AuthService, JwtStrategy, RolesGuard, CaslAbilityFactory],
})
export class AuthModule {}
