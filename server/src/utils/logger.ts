import winston from "winston";
import { config } from "../config/env";

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: config.isDevelopment ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: "investment-agent" },
  transports: [
    new winston.transports.Console({
      format: config.isDevelopment
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
  ],
});

export { logger };
