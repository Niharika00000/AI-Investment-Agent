import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import type { InvestmentReport, RequestStatus } from "../types";

export class ResearchRepository {
  async createRequest(companyName: string, userId?: string): Promise<string> {
    const request = await prisma.researchRequest.create({
      data: { companyName, status: "PENDING", userId },
    });
    logger.info(`Created research request: ${request.id} for ${companyName} (user: ${userId ?? "none"})`);
    return request.id;
  }

  async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
    await prisma.researchRequest.update({
      where: { id },
      data: { status },
    });
  }

  async saveReport(
    requestId: string,
    report: InvestmentReport
  ): Promise<void> {
    await prisma.researchReport.upsert({
      where: { requestId },
      create: {
        requestId,
        companyName: report.companyName,
        ticker: report.ticker,
        summary: report.summary,
        financialScore: report.financialHealth.score,
        financialExplanation: report.financialHealth.explanation,
        sentimentScore: report.sentiment.score,
        sentimentExplanation: report.sentiment.explanation,
        competitiveScore: report.competitivePosition.score,
        competitiveExplanation: report.competitivePosition.explanation,
        riskScore: report.riskLevel.score,
        riskExplanation: report.riskLevel.explanation,
        finalDecision: report.finalDecision,
        confidence: report.confidence,
        reasoning: report.reasoning,
        fullReport: JSON.stringify(report),
        sources: JSON.stringify(report.sources),
        agentTimeline: JSON.stringify(report.agentTimeline),
      },
      update: {
        companyName: report.companyName,
        ticker: report.ticker,
        summary: report.summary,
        financialScore: report.financialHealth.score,
        financialExplanation: report.financialHealth.explanation,
        sentimentScore: report.sentiment.score,
        sentimentExplanation: report.sentiment.explanation,
        competitiveScore: report.competitivePosition.score,
        competitiveExplanation: report.competitivePosition.explanation,
        riskScore: report.riskLevel.score,
        riskExplanation: report.riskLevel.explanation,
        finalDecision: report.finalDecision,
        confidence: report.confidence,
        reasoning: report.reasoning,
        fullReport: JSON.stringify(report),
        sources: JSON.stringify(report.sources),
        agentTimeline: JSON.stringify(report.agentTimeline),
      },
    });
    logger.info(`Saved report for requestId: ${requestId}`);
  }

  async logAgent(
    requestId: string,
    agentName: string,
    input: Record<string, unknown> | null,
    output: Record<string, unknown> | null,
    status: string,
    startTime: Date,
    endTime: Date,
    error?: string
  ): Promise<void> {
    await prisma.agentLog.create({
      data: {
        requestId,
        agentName,
        input: input ? JSON.stringify(input) : null,
        output: output ? JSON.stringify(output) : null,
        status,
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
        error: error ?? null,
      },
    });
  }

  async getReportById(requestId: string): Promise<InvestmentReport | null> {
    const record = await prisma.researchReport.findUnique({
      where: { requestId },
    });

    if (!record?.fullReport) return null;

    return JSON.parse(record.fullReport) as unknown as InvestmentReport;
  }

  async getRequestById(id: string) {
    return prisma.researchRequest.findUnique({
      where: { id },
      include: { report: true },
    });
  }

  async getRecentReports(limit = 10, userId?: string) {
    return prisma.researchReport.findMany({
      where: userId ? { request: { userId } } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        requestId: true,
        companyName: true,
        ticker: true,
        finalDecision: true,
        confidence: true,
        financialScore: true,
        sentimentScore: true,
        riskScore: true,
        createdAt: true,
      },
    });
  }

  async getAgentLogs(requestId: string) {
    const logs = await prisma.agentLog.findMany({
      where: { requestId },
      orderBy: { startTime: "asc" },
    });
    return logs.map((log) => ({
      ...log,
      input: log.input ? JSON.parse(log.input) : null,
      output: log.output ? JSON.parse(log.output) : null,
    }));
  }
}

export const researchRepository = new ResearchRepository();
