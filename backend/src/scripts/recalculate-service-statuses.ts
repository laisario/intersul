import { config } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ServicesService } from '../modules/services/service/services';
import { ServiceStatus } from '../common/enums/service-status.enum';

const envPath = resolve(__dirname, '../../.env');
config({ path: envPath });

async function bootstrap() {
  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
  } catch (error: any) {
    if (error.message?.includes('database') || error.message?.includes('Access denied')) {
      console.error('❌ Erro de conexão com o banco de dados');
      console.error('Verifique se o banco está rodando e as credenciais estão corretas');
      process.exit(1);
    }
    throw error;
  }

  const servicesService = app.get(ServicesService);

  try {
    let processed = 0;
    let skipped = 0;
    let page = 1;
    const limit = 100;

    const firstPage = await servicesService.findAll({ limit, page: 1 });
    const total = firstPage.total;
    const totalPages = firstPage.totalPages;

    console.log(`📋 Encontrados ${total} serviços. Recalculando status...`);

    for (page = 1; page <= totalPages; page++) {
      const result = page === 1 ? firstPage : await servicesService.findAll({ limit, page });
      for (const service of result.data) {
        if (service.status === ServiceStatus.CANCELLED) {
          skipped++;
          continue;
        }
        await servicesService.recalculateStatus(service.id);
        processed++;
        if (processed % 100 === 0) {
          console.log(`   Processados: ${processed}`);
        }
      }
    }

    console.log('✅ Recalculação concluída!');
    console.log(`   Total processados: ${processed}`);
    console.log(`   Ignorados (CANCELLED): ${skipped}`);
  } catch (error: any) {
    console.error('❌ Erro ao recalcular status:', error.message);
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
