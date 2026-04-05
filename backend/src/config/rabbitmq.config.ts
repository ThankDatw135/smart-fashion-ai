import { registerAs } from '@nestjs/config';

// Cấu hình RabbitMQ — message broker cho giao tiếp Backend ↔ AI Service
export default registerAs('rabbitmq', () => ({
  url:
    process.env.RABBITMQ_URL ||
    'amqp://smartfashion:smartfashion_secret@localhost:5672',
  queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || 'sf',
}));
