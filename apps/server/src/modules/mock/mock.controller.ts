import {
  Controller,
  All,
  Req,
  Param,
  NotFoundException,
  UseInterceptors,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "express";
import { MockEndpoint } from "../../entities/mock-endpoint.entity";
import { ChaosInterceptor } from "../../chaos/chaos.interceptor";

@Controller("mocks/:projectId")
@UseInterceptors(ChaosInterceptor) // Apply Chaos Engineering logic
export class MockController {
  private readonly logger = new Logger(MockController.name);

  constructor(
    @InjectRepository(MockEndpoint)
    private mockEndpointRepo: Repository<MockEndpoint>,
  ) {}

  @All("*")
  async handleMockRequest(
    @Param("projectId") projectId: string,
    @Req() req: Request,
  ) {
    const method = req.method.toUpperCase();

    // Safer path extraction:
    // 1. Get the full path from req.originalUrl (includes query params, but we strip them later if needed)
    // 2. Remove the base prefix /mocks/:projectId
    // 3. Ensure we have a valid relative path starting with /

    const fullPath = req.path; // NestJS often strips the global prefix but keeps the controller path
    // Let's assume req.path is something like /mocks/123/users
    // We want /users

    const prefix = `/mocks/${projectId}`;
    let relativePath = fullPath;

    if (relativePath.startsWith(prefix)) {
      relativePath = relativePath.slice(prefix.length);
    }

    if (!relativePath || relativePath === "") {
      relativePath = "/";
    }

    this.logger.debug(
      `Mock Request: ${method} ${relativePath} (Project: ${projectId})`,
    );

    // 1. Find the matching endpoint
    const endpoint = await this.mockEndpointRepo.findOne({
      where: {
        projectId,
        method,
        path: relativePath,
      },
    });

    if (!endpoint) {
      this.logger.warn(`Endpoint not found: ${method} ${relativePath}`);
      throw new NotFoundException({
        error: "Mock Endpoint Not Found",
        message: `The path ${method} ${relativePath} has not been generated yet. Try scanning your repo again.`,
      });
    }

    // 2. Return the stored JSON data
    // If responseData is stored as a JSON string (in MySQL text column), parse it.
    // However, if we used @Column('json'), TypeORM handles it automatically.
    // Based on the entity definition: @Column('json'), it is an object.
    return endpoint.responseData;
  }
}
