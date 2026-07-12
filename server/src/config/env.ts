import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });


export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  mockMode: process.env.MOCK_MODE === "false",

  llm: {
    provider: (process.env.LLM_PROVIDER || "google") as "openai" | "anthropic" | "google",
    openaiApiKey: process.env.MOCK_MODE === "true" ? "mock-key" : (process.env.OPENAI_API_KEY || ""),
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    googleModel: process.env.GOOGLE_MODEL || "gemini-1.5-flash",
  },

  newsApi: {
    apiKey: process.env.NEWS_API_KEY || "",
    baseUrl: "https://newsapi.org/v2",
  },

  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
    baseUrl: "https://www.alphavantage.co/query",
  },

  finnhub: {
    apiKey: process.env.FINNHUB_API_KEY || "",
    baseUrl: "https://finnhub.io/api/v1",
  },

  cache: {
    ttlFinancial: parseInt(process.env.CACHE_TTL_FINANCIAL || "3600", 10),
    ttlNews: parseInt(process.env.CACHE_TTL_NEWS || "1800", 10),
    ttlReport: parseInt(process.env.CACHE_TTL_REPORT || "86400", 10),
  },

  jwtSecret: process.env.JWT_SECRET || "super-secret-investment-key",

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
