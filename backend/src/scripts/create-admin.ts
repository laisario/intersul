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
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'Xerox@2026';
  const adminName = 'Administrador TI';
  const adminRole = UserRole.ADMIN;

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
    // Use register method which already handles duplicate check and password hashing
    try {
      const result = await authService.register({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: adminRole,
      });

      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('ID:', result.user.id);
      console.log('Email:', result.user.email);
      console.log('Nome:', result.user.name);
      console.log('Perfil:', result.user.role);
      console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
    } catch (error: any) {
      if (error instanceof ConflictException || error.message?.includes('already exists')) {
        console.log('⚠️  Usuário administrador já existe');
        console.log('Email:', adminEmail);
        console.log('Para criar um novo administrador, use: npm run create-user');
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário administrador:', error.message);
    if (error.stack && process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

bootstrap();
