import { Controller, Post, HttpCode } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';

@Controller('queues')
export class QueuesController {
  private readonly logger = new Logger(QueuesController.name);

  constructor(
    @InjectQueue('billings')
    private billingsQueue: Queue,
  ) {}

  @Post('billings/test')
  @HttpCode(200)
  async enqueueTestJob() {
    this.logger.log('Enqueueing test job...');

    const job = await this.billingsQueue.add('test', {
      message: 'hello from api',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Test job enqueued with id: ${job.id}`);

    return {
      jobId: job.id,
      jobName: job.name,
      queuedAt: new Date().toISOString(),
    };
  }
}
