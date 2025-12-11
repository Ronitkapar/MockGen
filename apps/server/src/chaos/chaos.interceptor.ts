import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChaosService } from './chaos.service';

@Injectable()
export class ChaosInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ChaosInterceptor.name);

    constructor(private readonly chaosService: ChaosService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // 1. Identify the Project
        // The frontend must send this header when requesting mock data
        const projectId = request.headers['x-project-id'];

        if (!projectId) {
            // If no project context, skip chaos logic (e.g., system routes)
            return next.handle();
        }

        // 2. Retrieve Chaos Configuration
        const config = await this.chaosService.getChaosConfig(projectId as string);

        // 3. Apply Latency (Simulate Slow Network)
        if (config.latencyMs > 0) {
            this.logger.debug(`Applying ${config.latencyMs}ms latency to project ${projectId}`);
            await new Promise((resolve) => setTimeout(resolve, config.latencyMs));
        }

        // 4. Apply Error (Simulate 500 Server Error)
        if (config.forceError) {
            this.logger.warn(`Simulating 500 Error for project ${projectId}`);
            throw new InternalServerErrorException('Simulated Chaos Error: The server failed unexpectedly.');
        }

        return next.handle();
    }
}
