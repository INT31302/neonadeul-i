import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { AppConfigKey, AppConfigs } from '@src/config/app.config';
import { DatabaseConfigKey, DatabaseConfigs } from '@src/config/database.config';
import { Connection } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

class Module extends TypeOrmModule implements OnModuleInit {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {
    super();
  }

  /**
   * Module 이 초기화되면 database connection 연결을 확인합니다.
   */
  async onModuleInit(): Promise<void> {
    this.logger.debug(`onModuleInit`);

    const runner = this.connection.createQueryRunner('slave');

    try {
      const rows = await runner.query('select 1 as pong');
      if (Array.isArray(rows) && rows.length > 0 && rows[0].pong == '1') {
        return;
      }
    } catch (e) {
      throw e;
    } finally {
      await runner.release();
    }
    throw new Error('SomethingWrongWithDatabaseConfiguration');
  }
}

const DatabaseModule = Module.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService): TypeOrmModuleOptions => {
    const { isProduction } = config.get<AppConfigs>(AppConfigKey);

    const { database, host, port, user, password, shouldSync, shouldMigrate } = config.get<DatabaseConfigs>(DatabaseConfigKey);

    return {
      type: 'mysql',
      autoLoadEntities: true,
      namingStrategy: new SnakeNamingStrategy(),
      host: host,
      port: port,
      username: user,
      password: password,
      database: database,
      synchronize: shouldSync,
      // logging level
      logging: isProduction === true ? ['info'] : ['query', 'log', 'info', 'error'],
      migrationsRun: shouldMigrate,
      migrationsTableName: 'migration',
      migrations: [__dirname + '/migrations/*.js'],
      extra: {
        connectionLimit: 10,
      },
    };
  },
});

export default DatabaseModule;
