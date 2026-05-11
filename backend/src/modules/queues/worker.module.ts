import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BillingProcessor } from './processors/billing.processor';
import { BillingsService } from '../billings/billings.service';
import { Billing } from '../billings/entities/billing.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientCopyMachine } from '../copy-machines/entities/client-copy-machine.entity';
import { Service } from '../services/entities/service.entity';
import { Step } from '../services/entities/step.entity';
import { Category } from '../services/entities/category.entity';
import { User } from '../auth/entities/user.entity';
import { Address } from '../common/entities/address.entity';
import { Neighborhood } from '../common/entities/neighborhood.entity';
import { City } from '../common/entities/city.entity';
import { State } from '../common/entities/state.entity';
import { Country } from '../common/entities/country.entity';
import { Franchise } from '../copy-machines/entities/franchise.entity';
import { CopyMachineCatalog } from '../copy-machines/entities/copy-machine-catalog.entity';
import { getDatabaseConfig } from '../../config/database.config';
import { getRedisConfig } from '../../config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Billing,
      Client,
      ClientCopyMachine,
      Service,
      Step,
      Category,
      User,
      Address,
      Neighborhood,
      City,
      State,
      Country,
      Franchise,
      CopyMachineCatalog,
    ]),
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
  providers: [BillingProcessor, BillingsService],
  exports: [BillingProcessor],
})
export class WorkerModule {}
