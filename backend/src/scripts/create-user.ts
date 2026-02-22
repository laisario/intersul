import { config } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/services/auth';
import { UserRole } from '../common/enums/user-role.enum';
import { ConflictException } from '@nestjs/common';

// Load .env file from backend directory before creating app context
// This ensures environment variables are available when ConfigModule initializes
const envPath = resolve(__dirname, '../../.env');
config({ path: envPath });

async function bootstrap() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const name = args[2];
  const role = (args[3] as UserRole) || UserRole.TECHNICIAN;
  const phone = args[4];
  const position = args[5];

  if (!email || !password || !name) {
    console.error('Usage: npm run create-user <email> <password> <name> [role] [phone] [position]');
    console.error('');
    console.error('Examples:');
    console.error('  npm run create-user user@example.com password123 "John Doe" ADMIN');
    console.error('  npm run create-user user@example.com password123 "John Doe" MANAGER "123456789" "Manager"');
    console.error('');
    console.error('Roles: ADMIN, MANAGER, TECHNICIAN, COMMERCIAL');
    process.exit(1);
  }

  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
  } catch (error: any) {
    if (error.message?.includes('database') || error.message?.includes('Access denied')) {
      console.error('❌ Erro de conexão com o banco de dados');
      console.error('Verifique se o banco está rodando e as credenciais estão corretas');
      console.error('Variáveis de ambiente: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
      process.exit(1);
    }
    throw error;
  }

  const authService = app.get(AuthService);

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
    if (phone) console.log('Phone:', phone);
    if (position) console.log('Position:', position);
  } catch (error: any) {
    if (error instanceof ConflictException || error.message?.includes('already exists')) {
      console.error('❌ Error: User with this email already exists');
      console.error(`Email: ${email}`);
    } else {
      console.error('❌ Error creating user:', error.message);
      if (error.stack && process.env.NODE_ENV !== 'production') {
        console.error(error.stack);
      }
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

bootstrap();

