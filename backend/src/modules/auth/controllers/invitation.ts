import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvitationService } from '../services/invitation';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';

@ApiTags('User Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users/invitations')
export class UserInvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  create(@Body() createDto: CreateInvitationDto, @CurrentUser() currentUser: CurrentUserData) {
    return this.invitationService.createInvitation(createDto, currentUser.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List user invitations' })
  @ApiResponse({ status: 200, description: 'List of invitations returned successfully' })
  findAll() {
    return this.invitationService.listInvitations();
  }
}

