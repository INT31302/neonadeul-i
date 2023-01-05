import { ConfigModule as NestJSConfigModule } from '@nestjs/config';
import AppConfig, { AppEnvKey } from '@src/config/app.config';
import DatabaseConfig from '@src/config/database.config';

// .env 또는 환경변수를 application 에서 사용할 수 있도록 설정합니다.
const ConfigModule = NestJSConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  envFilePath: (process.env.APP_ENV || AppEnvKey.LOCAL) === AppEnvKey.LOCAL ? '.env' : `.env.${process.env.APP_ENV}`,
  ignoreEnvFile: process.env.APP_ENV === AppEnvKey.PROD,
  load: [AppConfig, DatabaseConfig],
});

export default ConfigModule;
