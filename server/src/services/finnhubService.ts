import axios from "axios";
import { config } from "../config/env";
import { cacheService } from "./cacheService";
import { logger } from "../utils/logger";
import type { FinnhubNewsArticle } from "../types";

export interface FinnhubProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  ipo?: string;
  marketCapitalization?: number;
  name?: string;
  phone?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
  logo?: string;
  finnhubIndustry?: string;
}

export interface FinnhubQuote {
  c?: number;   // Current price
  h?: number;   // High price of the day
  l?: number;   // Low price of the day
  o?: number;   // Open price
  pc?: number;  // Previous close price
  t?: number;   // Timestamp
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

export interface FinnhubPeerResult {
  peers: string[];
}

class FinnhubService {
  private readonly baseUrl = config.finnhub.baseUrl;
  private readonly apiKey = config.finnhub.apiKey;

  private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn("Finnhub API key not configured");
      return null;
    }

    try {
      const response = await axios.get<T>(`${this.baseUrl}${endpoint}`, {
        params: { token: this.apiKey, ...params },
        timeout: 10000,
      });
      return response.data;
    } catch (err) {
      logger.error(`Finnhub API error for ${endpoint}`, { err });
      return null;
    }
  }

  async getCompanyProfile(ticker: string): Promise<FinnhubProfile | null> {
    const cacheKey = `finnhub:profile:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      () => this.get<FinnhubProfile>("/stock/profile2", { symbol: ticker }),
      config.cache.ttlFinancial
    );
  }

  async getCompanyNews(
    ticker: string,
    fromDate: string,
    toDate: string
  ): Promise<FinnhubNewsArticle[]> {
    const cacheKey = `finnhub:news:${ticker.toUpperCase()}:${fromDate}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await this.get<FinnhubNewsArticle[]>("/company-news", {
          symbol: ticker,
          from: fromDate,
          to: toDate,
        });
        return data || [];
      },
      config.cache.ttlNews
    );
  }

  async getRecommendations(ticker: string): Promise<FinnhubRecommendation[]> {
    const cacheKey = `finnhub:recommendations:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await this.get<FinnhubRecommendation[]>(
          "/stock/recommendation",
          { symbol: ticker }
        );
        return data || [];
      },
      config.cache.ttlFinancial
    );
  }

  async getPeers(ticker: string): Promise<string[]> {
    const cacheKey = `finnhub:peers:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await this.get<string[]>("/stock/peers", {
          symbol: ticker,
        });
        return data || [];
      },
      config.cache.ttlFinancial
    );
  }

  async getMarketNews(category: string = "general"): Promise<FinnhubNewsArticle[]> {
    const cacheKey = `finnhub:market-news:${category}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await this.get<FinnhubNewsArticle[]>("/news", {
          category,
        });
        return data || [];
      },
      config.cache.ttlNews
    );
  }

  getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }
}

export const finnhubService = new FinnhubService();
