import axios from "axios";
import { config } from "../config/env";
import { cacheService } from "./cacheService";
import { logger } from "../utils/logger";

export interface AlphaVantageOverview {
  Symbol?: string;
  AssetType?: string;
  Name?: string;
  Description?: string;
  CIK?: string;
  Exchange?: string;
  Currency?: string;
  Country?: string;
  Sector?: string;
  Industry?: string;
  Address?: string;
  FiscalYearEnd?: string;
  LatestQuarter?: string;
  MarketCapitalization?: string;
  EBITDA?: string;
  PERatio?: string;
  PEGRatio?: string;
  BookValue?: string;
  DividendPerShare?: string;
  DividendYield?: string;
  EPS?: string;
  RevenuePerShareTTM?: string;
  ProfitMargin?: string;
  OperatingMarginTTM?: string;
  ReturnOnAssetsTTM?: string;
  ReturnOnEquityTTM?: string;
  RevenueTTM?: string;
  GrossProfitTTM?: string;
  DilutedEPSTTM?: string;
  QuarterlyEarningsGrowthYOY?: string;
  QuarterlyRevenueGrowthYOY?: string;
  AnalystTargetPrice?: string;
  TrailingPE?: string;
  ForwardPE?: string;
  PriceToSalesRatioTTM?: string;
  PriceToBookRatio?: string;
  EVToRevenue?: string;
  EVToEBITDA?: string;
  Beta?: string;
  "52WeekHigh"?: string;
  "52WeekLow"?: string;
  "50DayMovingAverage"?: string;
  "200DayMovingAverage"?: string;
  SharesOutstanding?: string;
  DividendDate?: string;
  ExDividendDate?: string;
}

class AlphaVantageService {
  private readonly baseUrl = config.alphaVantage.baseUrl;
  private readonly apiKey = config.alphaVantage.apiKey;

  async getCompanyOverview(ticker: string): Promise<AlphaVantageOverview | null> {
    if (!this.apiKey) {
      logger.warn("Alpha Vantage API key not configured");
      return null;
    }

    const cacheKey = `alphavantage:overview:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          console.log("Alpha Vantage API Key:", this.apiKey);
          const response = await axios.get<AlphaVantageOverview>(
            this.baseUrl,
            {
              params: {
                function: "OVERVIEW",
                symbol: ticker,
                apikey: this.apiKey,
              },
              timeout: 15000,
            }
          );

          console.log("========== ALPHA VANTAGE RESPONSE ==========");
console.log(response.data);
console.log("============================================");

          // Alpha Vantage returns empty object or note when rate limited
          if (!response.data.Symbol) {
            logger.warn(
              `Alpha Vantage returned no data for ${ticker} - may be rate limited`
            );
            return null;
          }

          return response.data;
        } catch (err) {
          logger.error("Alpha Vantage overview fetch failed", {
            err,
            ticker,
          });
          return null;
        }
      },
      config.cache.ttlFinancial
    );
  }

  async getIncomeStatement(ticker: string): Promise<Record<string, unknown> | null> {
    if (!this.apiKey) return null;

    const cacheKey = `alphavantage:income:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get(this.baseUrl, {
            params: {
              function: "INCOME_STATEMENT",
              symbol: ticker,
              apikey: this.apiKey,
            },
            timeout: 15000,
          });
          return response.data;
        } catch (err) {
          logger.error("Alpha Vantage income statement fetch failed", {
            err,
            ticker,
          });
          return null;
        }
      },
      config.cache.ttlFinancial
    );
  }

  async searchSymbol(keywords: string): Promise<string | null> {
    if (!this.apiKey) return null;

    const cacheKey = `alphavantage:search:${keywords.toLowerCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get(this.baseUrl, {
            params: {
              function: "SYMBOL_SEARCH",
              keywords: keywords,
              apikey: this.apiKey,
            },
            timeout: 15000,
          });

          const matches = (response.data as any)?.bestMatches || [];
          if (matches.length > 0) {
            // Find first equity match in the United States / USD to ensure we get a valid ticker for overview
            const usEquity = matches.find((m: any) => 
              (m["3. type"] === "Equity" || m["3. type"] === "Common Stock") &&
              (m["4. region"] === "United States" || m["8. currency"] === "USD" || !m["1. symbol"].includes("."))
            );
            return usEquity ? usEquity["1. symbol"] : matches[0]["1. symbol"];
          }
          return null;
        } catch (err) {
          logger.error("Alpha Vantage symbol search failed", { err, keywords });
          return null;
        }
      },
      config.cache.ttlFinancial
    );
  }
}

export const alphaVantageService = new AlphaVantageService();
