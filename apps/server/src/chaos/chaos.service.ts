import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ChaosSettings, UpdateChaosInput } from './dto/chaos.dto';

@Injectable()
export class ChaosService {
    private readonly logger = new Logger(ChaosService.name);
    private readonly TTL_SECONDS = 3600; // 1 Hour

    constructor(@Inject('REDIS') private readonly redis: Redis) { }

    private getKey(projectId: string): string {
        return `chaos:${projectId}`;
    }

    async getChaosConfig(projectId: string): Promise<ChaosSettings> {
        const data = await this.redis.get(this.getKey(projectId));

        if (!data) {
            return { latencyMs: 0, forceError: false };
        }

        try {
            return JSON.parse(data);
        } catch (e) {
            this.logger.error(`Failed to parse chaos config for project ${projectId}`);
            return { latencyMs: 0, forceError: false };
        }
    }

    async setChaosConfig(projectId: string, settings: UpdateChaosInput): Promise<ChaosSettings> {
        const key = this.getKey(projectId);
        await this.redis.set(key, JSON.stringify(settings), 'EX', this.TTL_SECONDS);

        this.logger.log(`Chaos config updated for ${projectId}: ${settings.latencyMs}ms, Error: ${settings.forceError}`);
        return settings;
    }
}
