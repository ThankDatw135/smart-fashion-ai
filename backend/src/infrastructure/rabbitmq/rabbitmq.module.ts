import { Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service.js';

/**
 * RabbitMQ Module — Global cho publish/subscribe events
 */
@Global()
@Module({
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
