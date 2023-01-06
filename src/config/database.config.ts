import { ConfigFactory, registerAs } from '@nestjs/config';

// config name space key
const DatabaseConfigKey = 'database';

interface DatabaseConfigs {
  url: string;
  sync: boolean;
}

//
const DatabaseConfig = registerAs<DatabaseConfigs, ConfigFactory<DatabaseConfigs>>(DatabaseConfigKey, () => {
  return {
    url: process.env.CLEARDB_DATABASE_URL || '',
    sync: process.env.DB_SYNC === 'true',
  };
});

export default DatabaseConfig;
export { DatabaseConfigKey, DatabaseConfigs };
