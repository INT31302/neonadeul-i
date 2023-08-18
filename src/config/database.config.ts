import { ConfigFactory, registerAs } from '@nestjs/config';
import { AppEnvKey } from '@src/config/app.config';

// config name space key
const DatabaseConfigKey = 'database';

interface DatabaseConfigs {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  shouldSync: boolean;
  shouldMigrate: boolean;
}

//
const DatabaseConfig = registerAs<DatabaseConfigs, ConfigFactory<DatabaseConfigs>>(DatabaseConfigKey, () => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_DATABASE || 'test',
    password: process.env.DB_PASSWORD || '',
    shouldSync: process.env.APP_ENV === AppEnvKey.PROD ? false : process.env.DB_SYNC === 'true',
    shouldMigrate: process.env.DB_MIGRATE === 'true',
  };
});

export default DatabaseConfig;
export { DatabaseConfigKey, DatabaseConfigs };
