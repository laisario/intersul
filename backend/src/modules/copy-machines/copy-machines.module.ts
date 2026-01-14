import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopyMachinesService } from './copy-machines.service';
import { CopyMachinesController } from './copy-machines.controller';
import { CopyMachineCatalog } from './entities/copy-machine-catalog.entity';
import { ClientCopyMachine } from './entities/client-copy-machine.entity';
import { Franchise } from './entities/franchise.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CopyMachineCatalog, ClientCopyMachine, Franchise]),
    CommonModule,
  ],
  controllers: [CopyMachinesController],
  providers: [CopyMachinesService],
  exports: [CopyMachinesService],
})
export class CopyMachinesModule {}
