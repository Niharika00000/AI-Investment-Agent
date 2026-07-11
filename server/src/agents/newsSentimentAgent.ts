import { createLLM } from "../lib/llm";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { newsApiService } from "../services/newsApiService";
import { finnhubService } from "../services/finnhubService";
import { logger } from "../utils/logger";
import type { GraphState, NewsSentimentOutput, NewsItem, SourceEntry } from "../types";

const SentimentEnum = z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]);

const NewsSentimentSchema = z.object({
  overallSentiment: SentimentEnum.describe(
    "Overall sentiment of recent news coverage"
  ),
  positiveFactors: z
    .array(z.string())
    .describe("List of positive news/developments driving optimism"),
  negativeFactors: z
    .array(z.string())
    .describe("List of negative news/concerns driving pessimism"),
  newsHeadlines: z
    .array(z.string())
    .describe("Up to 6 key news article headlines"),
  newsSummaries: z
    .array(z.string())
    .describe("1-2 sentence summary for each headline, in same order"),
  newsSentiments: z
    .array(SentimentEnum)
    .describe("Sentiment (POSITIVE/NEGATIVE/NEUTRAL) for each headline, in same order"),
  newsUrls: z
    .array(z.string())
    .describe("URL for each news article, or '#' if unavailable, in same order"),
  newsSources: z
    .array(z.string())
    .describe("Source name for each article (e.g., 'Reuters'), in same order"),
  newsDates: z
    .array(z.string())
    .describe("ISO date string for each article, in same order"),
  analystRating: z
    .string()
    .describe(
      "Summary of analyst consensus (e.g., 'Strong Buy', 'Buy', 'Hold', 'Sell')"
    ),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Sentiment score 0-100 where 100 = extremely positive sentiment, 0 = extremely negative"
    ),
  explanation: z
    .string()
    .describe(
      "2-3 sentence explanation of the overall sentiment and key drivers"
    ),
});

export async function newsSentimentAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "News & Sentiment Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Analyzing news for: ${state.companyName}`);

  try {
    const ticker = state.companyResearch?.ticker;
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = finnhubService.getDateDaysAgo(30);

    // Fetch news from multiple sources in parallel
    const [newsApiArticles, finnhubArticles] = await Promise.allSettled([
      newsApiService.getCompanyNews(state.companyName, ticker ?? undefined),
      ticker
        ? finnhubService.getCompanyNews(ticker, thirtyDaysAgo, today)
        : Promise.resolve([]),
    ]);

    const newsApi =
      newsApiArticles.status === "fulfilled" ? newsApiArticles.value : [];
    const finnhub =
      finnhubArticles.status === "fulfilled" ? finnhubArticles.value : [];

    // Collect sources
    const newsSources: SourceEntry[] = [];
    const newsContext = buildNewsContext(
      state.companyName,
      ticker ?? null,
      newsApi,
      finnhub,
      newsSources
    );

    const llm = createLLM({ temperature: 0.2 });

    const structuredLlm = llm.withStructuredOutput(NewsSentimentSchema, {
      name: "news_sentiment_output",
    });

    const messages = [
      new SystemMessage(
        `You are an expert financial analyst specializing in news sentiment analysis and market intelligence.
        Analyze the provided news articles and market data to assess overall sentiment for this company.
        
        Sentiment scoring guide (0-100):
        - 80-100: Overwhelmingly positive news, strong momentum, positive analyst coverage
        - 60-79: Mostly positive with minor concerns
        - 40-59: Mixed/neutral sentiment, balanced positive and negative
        - 20-39: Mostly negative, significant concerns
        - 0-19: Extremely negative, major issues, crisis-level news
        
        Focus on: recent earnings beats/misses, product launches, regulatory news, 
        leadership changes, market share, partnerships, and macro factors affecting the company.
        
        For keyNews, select the 6-8 most investment-relevant articles.
        For articles without URLs, use the company investor relations page.`
      ),
      new HumanMessage(newsContext),
    ];

    const result = await structuredLlm.invoke(messages);

    const keyNews: NewsItem[] = (result.newsHeadlines || []).map((title: string, i: number) => ({
      title,
      summary: result.newsSummaries?.[i] || "",
      sentiment: result.newsSentiments?.[i] || "NEUTRAL",
      url: result.newsUrls?.[i] || `https://finance.yahoo.com/quote/${ticker}`,
      source: result.newsSources?.[i] || "Yahoo Finance",
      publishedAt: result.newsDates?.[i] || new Date().toISOString(),
    }));

    const output: NewsSentimentOutput = {
      overallSentiment: result.overallSentiment,
      positiveFactors: result.positiveFactors,
      negativeFactors: result.negativeFactors,
      keyNews,
      analystRating: result.analystRating,
      score: result.score,
      explanation: result.explanation,
    };

    const endTime = new Date();

    // Add unique news sources
    const uniqueNewsUrls = new Set<string>();
    keyNews.forEach((article) => {
      if (!uniqueNewsUrls.has(article.url)) {
        uniqueNewsUrls.add(article.url);
        newsSources.push({
          name: article.source,
          url: article.url,
          type: "NEWS",
        });
      }
    });

    return {
      newsSentiment: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Sentiment: ${result.overallSentiment} | Score: ${output.score}/100 | Analyzed ${newsApi.length + finnhub.length} articles`,
        },
      ],
      sources: [
        ...state.sources,
        ...newsSources.slice(0, 5), // Limit to top 5 news sources
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    const fallbackOutput: NewsSentimentOutput = {
      overallSentiment: "NEUTRAL",
      positiveFactors: [],
      negativeFactors: [],
      keyNews: [],
      analystRating: "Hold",
      score: 50,
      explanation: isRateLimit
        ? "News sentiment analysis temporarily unavailable due to API rate limits. Neutral score of 50/100 assigned. Please retry for accurate analysis."
        : `News sentiment analysis failed: ${errorMsg}`,
    };

    return {
      newsSentiment: fallbackOutput,
      errors: [...state.errors, `${agentName}: ${errorMsg}`],
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "FAILED",
          summary: isRateLimit ? "Rate limited - used fallback data" : `Failed: ${errorMsg}`,
        },
      ],
    };
  }
}

function buildNewsContext(
  companyName: string,
  ticker: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newsApiArticles: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finnhubArticles: any[],
  sources: SourceEntry[]
): string {
  const sections: string[] = [
    `## News & Sentiment Analysis\nCompany: ${companyName}\nTicker: ${ticker || "Unknown"}\n`,
  ];

  if (newsApiArticles.length > 0) {
    const articles = newsApiArticles.slice(0, 15).map((a, i) => {
      if (a.url) {
        sources.push({ name: a.source?.name || "News", url: a.url, type: "NEWS" });
      }
      return `${i + 1}. [${a.source?.name || "Unknown"}] ${a.title}
   Date: ${a.publishedAt}
   URL: ${a.url || "N/A"}
   Summary: ${a.description || a.content?.slice(0, 200) || "No description"}`;
    });
    sections.push(`## NewsAPI Articles (${newsApiArticles.length} total)\n${articles.join("\n\n")}`);
  }

  if (finnhubArticles.length > 0) {
    const articles = finnhubArticles.slice(0, 10).map((a, i) => {
      if (a.url) {
        sources.push({ name: a.source || "Finnhub", url: a.url, type: "NEWS" });
      }
      return `${i + 1}. [${a.source || "Unknown"}] ${a.headline}
   Date: ${new Date(a.datetime * 1000).toISOString()}
   URL: ${a.url || "N/A"}
   Summary: ${a.summary || "No summary"}`;
    });
    sections.push(`## Finnhub News (${finnhubArticles.length} total)\n${articles.join("\n\n")}`);
  }

  if (newsApiArticles.length === 0 && finnhubArticles.length === 0) {
    sections.push(
      `No news articles found from APIs. Please use your training data knowledge to assess recent sentiment for ${companyName}.`
    );
  }

  return sections.join("\n\n");
}
