import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './services/auth';
import { AuthController } from './controllers/auth';
import { User } from './entities/user.entity';
import { UserInvitation } from './entities/user-invitation.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../../config/jwt.config';
import { UserService } from './services/user';
import { UserController } from './controllers/user';
import { InvitationService } from './services/invitation';
import { UserInvitationController } from './controllers/invitation';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserInvitation]),
    PassportModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
    ConfigModule,
  ],
  providers: [AuthService, JwtStrategy, UserService, InvitationService, RolesGuard],
  controllers: [AuthController, UserController, UserInvitationController],
  exports: [AuthService, UserService, InvitationService],
})
export class AuthModule {}
