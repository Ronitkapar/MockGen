import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MockController } from "./mock.controller";
import { MockEndpoint } from "../../entities/mock-endpoint.entity";

@Module({
    imports: [TypeOrmModule.forFeature([MockEndpoint])],
    controllers: [MockController],
})
export class MockModule { }
