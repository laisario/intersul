import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './service/services';
import { ServicesController } from './controller/services';
import { Service } from './entities/service.entity';
import { Step } from './entities/step.entity';
import { Category } from './entities/category.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientCopyMachine } from '../copy-machines/entities/client-copy-machine.entity';
import { User } from '../auth/entities/user.entity';
import { ClientsModule } from '../clients/clients.module';
import { CopyMachinesModule } from '../copy-machines/copy-machines.module';
import { CategoryService } from './service/category';
import { CategoryController } from './controller/category';
import { StepService } from './service/step';
import { StepController } from './controller/step';
import { CommonModule } from '../common/common.module';
import { Approval } from '../common/entities/approval.entity';
import { Billing } from '../billings/entities/billing.entity';
import { StepChecklist } from './entities/step-checklist.entity';
import { StepChecklistService } from './service/step-checklist';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Category,
      Step,
      Client,
      ClientCopyMachine,
      User,
      Billing,
      StepChecklist,
      Approval,
    ]),
    ClientsModule,
    CopyMachinesModule,
    CommonModule,
  ],
  controllers: [ServicesController, CategoryController, StepController],
  providers: [
    ServicesService,
    CategoryService,
    StepService,
    StepChecklistService,
  ],
  exports: [
    ServicesService,
    CategoryService,
    StepService,
    StepChecklistService,
  ],
})
export class ServicesModule {}
