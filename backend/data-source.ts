import { DataSource } from 'typeorm';
import * as path from 'path';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_DATABASE || 'intersul',
};

export default new DataSource({
  type: 'mysql',
  ...dbConfig,
  entities: [path.join(__dirname, 'src/modules/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

