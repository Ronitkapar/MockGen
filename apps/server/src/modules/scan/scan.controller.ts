import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Controller("scan")
export class ScanController {
  constructor(@InjectQueue("repo-scan") private scanQueue: Queue) {}

  @Post()
  async scanRepository(
    @Body("projectId") projectId: string,
    @Body("codeSnippets") codeSnippets: string,
  ) {
    if (!projectId || !codeSnippets) {
      throw new HttpException(
        "Missing projectId or codeSnippets",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Add job to the queue
    const job = await this.scanQueue.add("analyze-frontend", {
      projectId,
      codeSnippets,
    });

    return {
      jobId: job.id,
      status: "queued",
      message: "Analysis started. Poll /scan/status/:jobId for results.",
    };
  }

  @Get("status/:jobId")
  async getJobStatus(@Param("jobId") jobId: string) {
    const job = await this.scanQueue.getJob(jobId);

    if (!job) {
      throw new HttpException("Job not found", HttpStatus.NOT_FOUND);
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId,
      state, // 'completed', 'failed', 'active', 'waiting'
      result,
      failedReason,
    };
  }
}
