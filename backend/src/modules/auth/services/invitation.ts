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
      position: createDto.position,
      email: createDto.email?.toLowerCase(),
      expires_at: expiresAt,
      created_by_id: createdById,
      used: false, // Explicitly set to false
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
      position: payload.position || invitation.position,
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
    const { createdBy, expires_at, used_at, created_at, updated_at, ...rest } = invitation;
    return {
      id: invitation.id,
      token: invitation.token,
      role: invitation.role,
      position: invitation.position ?? null,
      email: invitation.email ?? null,
      expiresAt: expires_at ? expires_at.toISOString() : null,
      used: invitation.used ?? false,
      usedAt: used_at ? used_at.toISOString() : null,
      createdAt: created_at.toISOString(),
      updatedAt: updated_at.toISOString(),
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

