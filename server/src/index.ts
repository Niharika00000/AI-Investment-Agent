import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { researchRouter } from "./routes/research";
import { authRouter } from "./routes/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./lib/prisma";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.isDevelopment && /^https?:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      if (origin === config.corsOrigin) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const researchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10000,
  message: { error: "Research limit reached. Please wait before running more analyses." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use("/api/research", researchLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    body: req.method === "POST" ? req.body : undefined,
  });
  next();
});

app.use("/api", authRouter);
app.use("/api", researchRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected");

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Investment Agent Server running on http://localhost:${config.port}`);
      logger.info(`   Environment: ${config.nodeEnv}`);
      logger.info(`   CORS Origin: ${config.corsOrigin}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server", { err });
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
