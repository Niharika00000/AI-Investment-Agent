import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 ? "Internal server error" : err.message;

  logger.error("Unhandled error", {
    status,
    message: err.message,
    stack: err.stack,
  });

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}
