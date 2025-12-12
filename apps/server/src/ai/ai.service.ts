import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { APPLY_PATCH_TOOL } from "../mcp/patch.tool";

export enum AiPersona {
  STUDENT = "STUDENT",
  PROFESSIONAL = "PROFESSIONAL",
}

export interface AiResponse {
  response: string;
  suggestedFix?: {
    explanation: string;
    codeBlock: string;
    targetFile: string;
    action: string;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      this.logger.warn("GEMINI_API_KEY is not set.");
    } else {
      const genAI = new GoogleGenerativeAI(apiKey);
      // We use gemini-pro or gemini-1.5-flash for tool support
      this.model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        tools: [{ functionDeclarations: [APPLY_PATCH_TOOL] }],
      });
    }
  }

  async analyzeLogs(
    logs: string,
    persona: AiPersona,
    userPrompt?: string,
  ): Promise<AiResponse> {
    if (!this.model) {
      throw new HttpException(
        "AI Service unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const safeLogs = logs.length > 10000 ? logs.slice(-10000) : logs;
    const systemPrompt = this.getSystemPrompt(persona);

    const fullPrompt = `
      ${systemPrompt}
      
      CONTEXT (TERMINAL LOGS):
      ${safeLogs}

      USER QUESTION:
      ${userPrompt || "Analyze the error. If you see a clear code fix, call the apply_patch function."}
    `;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;

      // Check for Function Calls (MCP Pattern)
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "apply_patch") {
          const args = call.args as any;

          return {
            response: args.explanation || "I've generated a patch for you.",
            suggestedFix: {
              explanation: args.explanation,
              codeBlock: args.codeBlock,
              targetFile: args.targetFile,
              action: args.action,
            },
          };
        }
      }

      // Fallback to standard text response
      return {
        response: response.text(),
      };
    } catch (error) {
      this.logger.error("AI Generation failed", error);
      throw new HttpException(
        "Failed to generate AI response",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getSystemPrompt(persona: AiPersona): string {
    const base = `You are an expert software architect debugging a Node.js/React environment.`;

    if (persona === AiPersona.STUDENT) {
      return `${base} Explain things simply. If you know the fix, use the apply_patch tool.`;
    } else {
      return `${base} Be concise. If the error is obvious, immediately use the apply_patch tool to fix the code.`;
    }
  }
}
