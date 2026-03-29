import { Module } from '@nestjs/common';
import { MailProcessor } from './mail.processor.js';

/**
 * Mail Module — đăng ký BullMQ processor xử lý gửi email
 * Queue 'mail' đã được đăng ký trong BullConfigModule (Phase 1)
 */
@Module({
  providers: [MailProcessor],
})
export class MailModule {}
