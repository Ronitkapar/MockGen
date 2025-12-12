import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";

import { ScanController } from "./scan.controller";
import { ScanProcessor } from "./scan.processor";
import { MockEndpoint } from "../../entities/mock-endpoint.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([MockEndpoint]),
        BullModule.registerQueue({
            name: "repo-scan",
        }),
    ],
    controllers: [ScanController],
    providers: [ScanProcessor],
})
export class ScanModule { }
