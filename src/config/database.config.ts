import { ConfigFactory, registerAs } from '@nestjs/config';

// config name space key
const DatabaseConfigKey = 'database';

interface DatabaseConfigs {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

//
const DatabaseConfig = registerAs<
  DatabaseConfigs,
  ConfigFactory<DatabaseConfigs>
>(DatabaseConfigKey, () => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_DATABASE || 'test',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
});

export default DatabaseConfig;
export { DatabaseConfigKey, DatabaseConfigs };
