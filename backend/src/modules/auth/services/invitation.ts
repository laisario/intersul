import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { UserInvitation } from '../entities/user-invitation.entity';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { AuthService } from './auth';

const DEFAULT_EXPIRATION_HOURS = 72;

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(UserInvitation)
    private readonly invitationRepository: Repository<UserInvitation>,
    private readonly authService: AuthService,
  ) {}

  async createInvitation(createDto: CreateInvitationDto, createdById: number) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = this.resolveExpiration(createDto.expiresInHours);

    const invitation = this.invitationRepository.create({
      token,
      role: createDto.role,
      email: createDto.email?.toLowerCase(),
      expires_at: expiresAt,
      created_by_id: createdById,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);
    const invitationWithRelations = await this.invitationRepository.findOne({
      where: { id: savedInvitation.id },
      relations: ['createdBy'],
    });

    return this.normalizeInvitation(invitationWithRelations!);
  }

  async listInvitations() {
    const invitations = await this.invitationRepository.find({
      order: { created_at: 'DESC' },
      relations: ['createdBy'],
    });

    return invitations.map((invitation) => this.normalizeInvitation(invitation));
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.invitationRepository.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return this.normalizeInvitation(invitation);
  }

  async acceptInvitation(payload: AcceptInvitationDto) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: payload.token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.used) {
      throw new BadRequestException('Invitation has already been used');
    }

    if (invitation.expires_at && invitation.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.email && invitation.email.toLowerCase() !== payload.email.toLowerCase()) {
      throw new BadRequestException('Email does not match invitation');
    }

    const response = await this.authService.registerWithInvitation({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: invitation.role as UserRole,
    });

    invitation.used = true;
    invitation.used_at = new Date();

    await this.invitationRepository.save(invitation);

    return response;
  }

  private resolveExpiration(expiresInHours?: number | null) {
    const hours = expiresInHours && expiresInHours > 0 ? expiresInHours : DEFAULT_EXPIRATION_HOURS;
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date;
  }

  private normalizeInvitation(invitation: UserInvitation) {
    const { createdBy, ...rest } = invitation;
    return {
      ...rest,
      createdBy: createdBy
        ? {
            id: createdBy.id,
            name: createdBy.name,
            email: createdBy.email,
          }
        : undefined,
    };
  }
}

