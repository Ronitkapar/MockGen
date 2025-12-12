import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { BullModule } from "@nestjs/bullmq";
import { APP_PIPE } from "@nestjs/core";
import { join } from "path";

// Entities
import { User } from "./entities/user.entity";
import { Project } from "./entities/project.entity";
import { MockEndpoint } from "./entities/mock-endpoint.entity";

// Modules
import { ScanModule } from "./modules/scan/scan.module";
import { MockModule } from "./modules/mock/mock.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "mysql",
        host: config.get("DB_HOST", "db"),
        port: 3306,
        username: config.get("DB_USERNAME", "mockgen_user"),
        password: config.get("DB_PASSWORD", "mockgen_password"),
        database: config.get("DB_DATABASE", "mockgen_db"),
        entities: [User, Project, MockEndpoint],
        synchronize: true,
      }),
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
    }),

    // Job Queue (BullMQ)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get("REDIS_HOST", "redis"),
          port: config.get("REDIS_PORT", 6379),
        },
      }),
    }),

    ScanModule,
    MockModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
