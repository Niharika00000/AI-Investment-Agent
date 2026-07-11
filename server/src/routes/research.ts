import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { runInvestmentResearch } from "../graphs/investmentGraph";
import { researchRepository } from "../repositories/researchRepository";
import { authMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

export const researchRouter = Router();

const ResearchRequestSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be under 100 characters")
    .trim(),
});

// POST /api/research — Start a new research job
researchRouter.post(
  "/research",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = ResearchRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.errors.map((e) => e.message),
        });
        return;
      }

      const { companyName } = parseResult.data;
      const userId = (req as AuthenticatedRequest).user?.id;

      logger.info(`Research request received for: ${companyName} (user: ${userId})`);

      // Create request in DB linked to the user
      const requestId = await researchRepository.createRequest(companyName, userId);
      await researchRepository.updateRequestStatus(requestId, "PROCESSING");

      // Run the LangGraph pipeline (synchronous — waits for result)
      const report = await runInvestmentResearch(companyName, requestId);

      // Persist report
      await researchRepository.saveReport(requestId, report);
      await researchRepository.updateRequestStatus(requestId, "COMPLETED");

      logger.info(
        `Research completed for ${companyName}: ${report.finalDecision} (${report.confidence}%)`
      );

      res.status(200).json({
        id: requestId,
        report,
      });
    } catch (err) {
      logger.error("Research failed", { err });
      next(err);
    }
  }
);

// GET /api/research/history — Get recent research history
researchRouter.get(
  "/research/history",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const reports = await researchRepository.getRecentReports(20, userId);
      res.json({ reports });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/research/:id — Get a specific report
researchRouter.get(
  "/research/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string") {
        res.status(400).json({ error: "Invalid request ID" });
        return;
      }

      const request = await researchRepository.getRequestById(id);

      if (!request) {
        res.status(404).json({ error: "Research report not found" });
        return;
      }

      // Check authorization (if report has a userId associated, compare it)
      const userId = (req as AuthenticatedRequest).user?.id;
      if (request.userId && request.userId !== userId) {
        res.status(403).json({ error: "Access denied: this report belongs to another user" });
        return;
      }

      if (request.status === "PROCESSING") {
        res.status(202).json({
          id,
          status: "PROCESSING",
          message: "Research is still in progress",
        });
        return;
      }

      if (request.status === "FAILED") {
        res.status(500).json({
          id,
          status: "FAILED",
          message: "Research failed",
        });
        return;
      }

      const report = await researchRepository.getReportById(id);

      if (!report) {
        res.status(404).json({ error: "Report data not found" });
        return;
      }

      res.json({ id, report });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/research/:id/logs — Get agent execution logs
researchRouter.get(
  "/research/:id/logs",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== "string") {
        res.status(400).json({ error: "Invalid request ID" });
        return;
      }
      
      const request = await researchRepository.getRequestById(id);
      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      // Check authorization
      const userId = (req as AuthenticatedRequest).user?.id;
      if (request.userId && request.userId !== userId) {
        res.status(403).json({ error: "Access denied: this log belongs to another user" });
        return;
      }

      const logs = await researchRepository.getAgentLogs(id);
      res.json({ logs });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/health — Health check
researchRouter.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
