import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';
import { Neighborhood } from './entities/neighborhood.entity';
import { Image } from './entities/image.entity';
import { LocationService } from './services/location.service';
import { ImageService } from './services/image.service';
import { AddressController } from './controllers/address.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Country, State, City, Neighborhood, Image])],
  controllers: [AddressController],
  providers: [LocationService, ImageService],
  exports: [TypeOrmModule, LocationService, ImageService],
})
export class CommonModule {}

