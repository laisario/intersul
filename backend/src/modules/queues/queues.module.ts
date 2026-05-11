import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueuesController } from './queues.controller';
import { getRedisConfig } from '../../config/redis.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConfig(configService),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'billings',
    }),
  ],
  controllers: [QueuesController],
  exports: [BullModule],
})
export class QueuesModule {}
