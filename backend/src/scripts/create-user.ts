import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/services/auth';
import { UserRole } from '../common/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const name = args[2];
  const role = (args[3] as UserRole) || UserRole.TECHNICIAN;
  const phone = args[4];
  const position = args[5];

  if (!email || !password || !name) {
    console.error('Usage: npm run create-user <email> <password> <name> [role] [phone] [position]');
    console.error('Roles: ADMIN, MANAGER, TECHNICIAN, COMMERCIAL');
    process.exit(1);
  }

  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(role)) {
    console.error(`Invalid role: ${role}`);
    console.error(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    const result = await authService.register({
      email,
      password,
      name,
      role,
      phone,
      position,
    });
    console.log('✅ User created successfully!');
    console.log('User ID:', result.user.id);
    console.log('Email:', result.user.email);
    console.log('Name:', result.user.name);
    console.log('Role:', result.user.role);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }

  await app.close();
}

bootstrap();

