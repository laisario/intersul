import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { BillingsService } from '../../billings/billings.service';
import { GenerateBillingsDto } from '../../billings/dto/generate-billings.dto';

@Injectable()
@Processor('billings', {
  concurrency: 1,
})
export class BillingProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(private readonly billingsService: BillingsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} - ${job.name}`);
    this.logger.log(`Job data: ${JSON.stringify(job.data)}`);

    switch (job.name) {
      case 'test':
        this.logger.log(
          'Test job received - payload: ' + JSON.stringify(job.data),
        );
        return { status: 'test completed' };

      case 'generate-by-city':
        this.logger.log(
          'Starting billing generation for city: ' + job.data.cityId,
        );

        try {
          const generateDto: GenerateBillingsDto = {
            city_id: job.data.cityId,
            machines: job.data.machines,
          };

          const result = await this.billingsService.generateByCity(generateDto);

          this.logger.log(
            `Billing generation completed: ${result.billings.length} billings, ${result.services.length} services, ${result.steps.length} steps`,
          );

          return {
            status: 'completed',
            billingsCount: result.billings.length,
            servicesCount: result.services.length,
            stepsCount: result.steps.length,
          };
        } catch (error) {
          this.logger.error(`Billing generation failed: ${error.message}`);
          throw error;
        }

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return { status: 'unknown job type' };
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
