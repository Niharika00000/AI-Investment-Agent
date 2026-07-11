import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern to prevent multiple connections in development
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

(prisma as any).$on("error", (e: any) => {
  logger.error("Prisma error", { error: e });
});

(prisma as any).$on("warn", (e: any) => {
  logger.warn("Prisma warning", { warning: e });
});
