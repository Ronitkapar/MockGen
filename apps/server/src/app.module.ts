import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_PIPE } from '@nestjs/core';
import { join } from 'path';

// Entities
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { MockEndpoint } from './entities/mock-endpoint.entity';

@Module({
    imports: [
        // 1. Configuration Module
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // 2. Database Module (MySQL)
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DB_HOST', 'db'),
                port: configService.get<number>('DB_PORT', 3306),
                username: configService.get<string>('DB_USERNAME', 'mockgen_user'),
                password: configService.get<string>('DB_PASSWORD', 'mockgen_password'),
                database: configService.get<string>('DB_DATABASE', 'mockgen_db'),
                entities: [User, Project, MockEndpoint],
                synchronize: true, // CAUTION: Only for development
                logging: true,
            }),
        }),

        // 3. GraphQL Module
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: true,
            introspection: true,
        }),
    ],
    controllers: [],
    providers: [
        // 4. Global Validation Pipe
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        },
    ],
})
export class AppModule { }
