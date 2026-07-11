import axios from "axios";
import { config } from "../config/env";
import { cacheService } from "./cacheService";
import { logger } from "../utils/logger";
import type { NewsApiArticle } from "../types";

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

class NewsApiService {
  private readonly baseUrl = config.newsApi.baseUrl;
  private readonly apiKey = config.newsApi.apiKey;

  async getCompanyNews(
    companyName: string,
    ticker?: string
  ): Promise<NewsApiArticle[]> {
    if (!this.apiKey) {
      logger.warn("NewsAPI key not configured, skipping news fetch");
      return [];
    }

    const query = ticker ? `${companyName} OR ${ticker}` : companyName;
    const cacheKey = `newsapi:company:${query.toLowerCase()}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get<NewsApiResponse>(
            `${this.baseUrl}/everything`,
            {
              params: {
                q: query,
                apiKey: this.apiKey,
                language: "en",
                sortBy: "publishedAt",
                pageSize: 20,
                from: this.getDateDaysAgo(30),
              },
              timeout: 10000,
            }
          );

          if (response.data.status !== "ok") {
            logger.warn("NewsAPI returned non-ok status", {
              status: response.data.status,
            });
            return [];
          }

          return response.data.articles.filter(
            (a) => a.title && a.title !== "[Removed]"
          );
        } catch (err) {
          logger.error("NewsAPI fetch failed", { err, company: companyName });
          return [];
        }
      },
      config.cache.ttlNews
    );
  }

  async getTopHeadlines(
    companyName: string
  ): Promise<NewsApiArticle[]> {
    if (!this.apiKey) return [];

    const cacheKey = `newsapi:headlines:${companyName.toLowerCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get<NewsApiResponse>(
            `${this.baseUrl}/everything`,
            {
              params: {
                q: companyName,
                apiKey: this.apiKey,
                language: "en",
                sortBy: "relevancy",
                pageSize: 10,
                from: this.getDateDaysAgo(7),
              },
              timeout: 10000,
            }
          );

          if (response.data.status !== "ok") return [];
          return response.data.articles.filter(
            (a) => a.title && a.title !== "[Removed]"
          );
        } catch (err) {
          logger.error("NewsAPI headlines fetch failed", { err });
          return [];
        }
      },
      config.cache.ttlNews
    );
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }
}

export const newsApiService = new NewsApiService();
