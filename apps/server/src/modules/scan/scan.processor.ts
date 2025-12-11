import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as jsf from 'json-schema-faker';

import { MockEndpoint } from '../../entities/mock-endpoint.entity';

// 1. Define the MCP Tool
const SAVE_SCHEMA_TOOL: FunctionDeclaration = {
    name: 'save_openapi_schema',
    description: 'Save the generated OpenAPI 3.0 schema based on the frontend code analysis.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            paths: {
                type: SchemaType.OBJECT,
                description: 'OpenAPI paths object (e.g., {"/users": {"get": ...}})',
            },
        },
        required: ['paths'],
    },
};

@Injectable()
@Processor('repo-scan')
export class ScanProcessor extends WorkerHost {
    private readonly logger = new Logger(ScanProcessor.name);
    private genAI: GoogleGenerativeAI;

    constructor(
        private configService: ConfigService,
        @InjectRepository(MockEndpoint)
        private mockEndpointRepo: Repository<MockEndpoint>,
    ) {
        super();
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.genAI = new GoogleGenerativeAI(apiKey);

        // Configure JSON Schema Faker to be realistic
        jsf.option({
            useDefaultValue: true,
            alwaysFakeOptionals: true,
        });
    }

    async process(job: Job<{ projectId: string; codeSnippets: string }>): Promise<any> {
        const { projectId, codeSnippets } = job.data;
        this.logger.log(`Processing scan for project: ${projectId}`);

        try {
            // 2. Initialize Gemini with Tools
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash', // Fast and capable of tool calling
                tools: [{ functionDeclarations: [SAVE_SCHEMA_TOOL] }],
            });

            // 3. The Agent Prompt
            const prompt = `
        You are a Backend Architect. 
        Analyze the following Frontend Code Snippets to infer the required Backend API.
        
        CODE SNIPPETS:
        ${codeSnippets.substring(0, 15000)} // Token limit safety

        INSTRUCTIONS:
        1. Identify all API calls (fetch, axios, etc.).
        2. Infer the Method (GET, POST), Path, and expected Response Structure.
        3. Construct a valid OpenAPI 3.0 Schema "paths" object.
        4. IMMEDIATELY call the 'save_openapi_schema' tool with this object.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const functionCalls = response.functionCalls();

            if (!functionCalls || functionCalls.length === 0) {
                throw new Error('AI failed to generate a schema tool call.');
            }

            const toolCall = functionCalls[0];

            if (toolCall.name === 'save_openapi_schema') {
                const schemaArgs = toolCall.args as any;
                await this.seedDatabase(projectId, schemaArgs.paths);
                return { success: true, endpointsGenerated: Object.keys(schemaArgs.paths).length };
            }

            return { success: false, reason: 'No valid tool call found' };

        } catch (error) {
            this.logger.error(`Scan failed for ${projectId}`, error);
            throw error;
        }
    }

    // 4. The Builder: Generate Mock Data & Save
    private async seedDatabase(projectId: string, paths: any) {
        // Clear existing endpoints for this project to avoid duplicates
        await this.mockEndpointRepo.delete({ projectId });

        const endpointsToSave: Partial<MockEndpoint>[] = [];

        for (const [path, methods] of Object.entries(paths)) {
            for (const [method, details] of Object.entries(methods as any)) {
                const responseSchema = (details as any).responses?.['200']?.content?.['application/json']?.schema;

                let fakeData = {};
                if (responseSchema) {
                    try {
                        // Generate realistic data based on the schema
                        fakeData = await jsf.resolve(responseSchema);
                    } catch (e) {
                        this.logger.warn(`Failed to generate fake data for ${path}`, e);
                        fakeData = { message: 'Auto-generated mock response' };
                    }
                }

                endpointsToSave.push({
                    projectId,
                    method: method.toUpperCase(),
                    path: path, // e.g., "/users"
                    responseData: fakeData,
                    chaosConfig: null,
                });
            }
        }

        if (endpointsToSave.length > 0) {
            await this.mockEndpointRepo.save(endpointsToSave);
            this.logger.log(`Seeded ${endpointsToSave.length} endpoints for project ${projectId}`);
        }
    }
}
