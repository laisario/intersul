import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateInvitationDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose({ name: 'expires_in_hours' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  expiresInHours?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

