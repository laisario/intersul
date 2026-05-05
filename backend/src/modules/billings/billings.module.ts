import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingsService } from './billings.service';
import { BillingsController } from './billings.controller';
import { Billing } from './entities/billing.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientCopyMachine } from '../copy-machines/entities/client-copy-machine.entity';
import { Service } from '../services/entities/service.entity';
import { Step } from '../services/entities/step.entity';
import { Category } from '../services/entities/category.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Billing,
      Client,
      ClientCopyMachine,
      Service,
      Step,
      Category,
      User,
    ]),
  ],
  controllers: [BillingsController],
  providers: [BillingsService],
  exports: [BillingsService],
})
export class BillingsModule {}
