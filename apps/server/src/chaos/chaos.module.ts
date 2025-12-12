import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { ChaosService } from "./chaos.service";
import { ChaosInterceptor } from "./chaos.interceptor";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: "REDIS",
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new Redis({
                    host: config.get<string>("REDIS_HOST", "redis"),
                    port: config.get<number>("REDIS_PORT", 6379),
                });
            },
        },
        ChaosService,
        ChaosInterceptor,
    ],
    exports: ["REDIS", ChaosService, ChaosInterceptor],
})
export class ChaosModule { }
