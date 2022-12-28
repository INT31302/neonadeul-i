import { ConfigFactory, registerAs } from '@nestjs/config';

// AppConfig structure
interface AppConfigs {
  env: string;
  port: number;
  isProduction: boolean;
}

// config name space key
const AppConfigKey = 'app';

// 사용 가능한 환경
enum AppEnvKey {
  LOCAL = 'local',
  PROD = 'prod',
}

// ConfigFactory
const AppConfig = registerAs<AppConfigs, ConfigFactory<AppConfigs>>(
  AppConfigKey,
  () => {
    const env = process.env.APP_ENV || AppEnvKey.LOCAL;
    const port = process.env.APP_PORT || '3000';
    const isProduction = env === AppEnvKey.PROD;

    return {
      env,
      port: Number.parseInt(port),
      isProduction,
    };
  },
);

export default AppConfig;
export { AppConfigKey, AppEnvKey, AppConfigs };
