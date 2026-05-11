import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './modules/queues/worker.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  logger.log('BullMQ Worker started successfully');
  logger.log('Listening for jobs on "billings" queue...');

  // Keep the worker running
  await app.init();
}

bootstrap();
