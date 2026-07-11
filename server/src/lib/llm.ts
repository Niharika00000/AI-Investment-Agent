import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../config/env";
import { logger } from "../utils/logger";

export type LLMProvider = "openai" | "anthropic" | "google";

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export function createLLM(options: LLMOptions = {}) {
  const { temperature = 0, maxTokens } = options;
  const provider = config.llm.provider as LLMProvider;

  logger.debug(`Creating LLM with provider: ${provider}`);

  const googleFallback = () =>
    new ChatGoogleGenerativeAI({
      apiKey: config.llm.googleApiKey,
      model: config.llm.googleModel,
      temperature,
      maxOutputTokens: maxTokens,
    });

  const openaiFallback = () =>
    new ChatOpenAI({
      openAIApiKey: config.llm.openaiApiKey,
      model: config.llm.openaiModel,
      temperature,
      maxTokens,
    });

  switch (provider) {
    case "anthropic": {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ChatAnthropic } = require("@langchain/anthropic");
        return new ChatAnthropic({
          anthropicApiKey: config.llm.anthropicApiKey,
          model: config.llm.anthropicModel,
          temperature,
          maxTokens,
        });
      } catch {
        logger.warn("@langchain/anthropic is not installed. Falling back to Gemini.");
        return googleFallback();
      }
    }

    case "openai": {
      try {
        return openaiFallback();
      } catch {
        logger.warn("OpenAI initialization failed. Falling back to Gemini.");
        return googleFallback();
      }
    }

    case "google":
    default: {
      if (provider !== "google") {
        logger.warn(`Unknown LLM_PROVIDER "${provider}", falling back to google`);
      }
      return googleFallback();
    }
  }
}
