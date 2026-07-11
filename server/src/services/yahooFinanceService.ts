import { cacheService } from "./cacheService";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { alphaVantageService } from "./alphaVantageService";

// Lazy ESM loader – yahoo-finance2 is ESM-only and cannot be statically require()'d
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _yf: any = null;
async function yf() {
  if (!_yf) {
    // @ts-ignore
    const mod = await import("yahoo-finance2");
    _yf = mod.default;
    _yf.setGlobalConfig({ validation: { logErrors: false } });
  }
  return _yf;
}

export interface YahooSearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  typeDisp?: string;
  quoteType?: string;
}

export interface YahooQuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  marketCap?: number;
  currency?: string;
  exchange?: string;
  quoteType?: string;
}

export interface IncomeStatement {
  endDate?: Date;
  totalRevenue?: number;
  grossProfit?: number;
  ebit?: number;
  netIncome?: number;
}

export interface BalanceSheet {
  endDate?: Date;
  totalAssets?: number;
  totalLiab?: number;
  totalStockholderEquity?: number;
  cash?: number;
  shortLongTermDebt?: number;
  longTermDebt?: number;
}

export interface CashflowStatement {
  endDate?: Date;
  totalCashFromOperatingActivities?: number;
  capitalExpenditures?: number;
  freeCashFlow?: number;
}

export interface YahooFinancialData {
  quote: YahooQuoteResult | null;
  profile: {
    longBusinessSummary?: string;
    website?: string;
    industry?: string;
    sector?: string;
    country?: string;
    city?: string;
    fullTimeEmployees?: number;
    companyOfficers?: Array<{ name?: string; title?: string }>;
  };
  financial: {
    totalRevenue?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    returnOnEquity?: number;
    debtToEquity?: number;
    currentRatio?: number;
    freeCashflow?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    targetMeanPrice?: number;
    recommendationKey?: string;
    numberOfAnalystOpinions?: number;
  };
  keyStats: {
    trailingPE?: number;
    forwardPE?: number;
    priceToBook?: number;
    enterpriseToEbitda?: number;
    beta?: number;
    "52WeekChange"?: number;
    pegRatio?: number;
  };
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashflows: CashflowStatement[];
  peers: string[];
}

function mapAlphaVantageToYahoo(overview: any): YahooFinancialData {
  const parseFloatSafe = (val: any) => {
    if (val === undefined || val === null || val === "None" || val === "N/A") return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  };

  const totalRevenue = parseFloatSafe(overview.RevenueTTM);
  const grossProfit = parseFloatSafe(overview.GrossProfitTTM);
  const grossMargins = totalRevenue && grossProfit ? grossProfit / totalRevenue : undefined;

  return {
    quote: {
      symbol: overview.Symbol || "",
      shortName: overview.Name,
      longName: overview.Name,
      regularMarketPrice: parseFloatSafe(overview.AnalystTargetPrice),
      marketCap: parseFloatSafe(overview.MarketCapitalization),
      currency: overview.Currency,
      exchange: overview.Exchange,
      quoteType: "EQUITY",
    },
    profile: {
      longBusinessSummary: overview.Description,
      website: overview.OfficialSite,
      industry: overview.Industry,
      sector: overview.Sector,
      country: overview.Country,
      city: overview.Address ? overview.Address.split(",")[1]?.trim() : undefined,
      companyOfficers: [],
    },
    financial: {
      totalRevenue,
      grossMargins,
      operatingMargins: parseFloatSafe(overview.OperatingMarginTTM),
      profitMargins: parseFloatSafe(overview.ProfitMargin),
      returnOnEquity: parseFloatSafe(overview.ReturnOnEquityTTM),
      debtToEquity: undefined,
      currentRatio: undefined,
      freeCashflow: parseFloatSafe(overview.EBITDA) ? parseFloatSafe(overview.EBITDA)! * 0.7 : undefined, // estimate FCF as 70% of EBITDA
      revenueGrowth: parseFloatSafe(overview.QuarterlyRevenueGrowthYOY),
      earningsGrowth: parseFloatSafe(overview.QuarterlyEarningsGrowthYOY),
      targetMeanPrice: parseFloatSafe(overview.AnalystTargetPrice),
      recommendationKey: (parseInt(overview.AnalystRatingBuy || "0") + parseInt(overview.AnalystRatingStrongBuy || "0") > parseInt(overview.AnalystRatingSell || "0")) ? "buy" : "hold",
      numberOfAnalystOpinions: undefined,
    },
    keyStats: {
      trailingPE: parseFloatSafe(overview.TrailingPE || overview.PERatio),
      forwardPE: parseFloatSafe(overview.ForwardPE),
      priceToBook: parseFloatSafe(overview.PriceToBookRatio),
      enterpriseToEbitda: parseFloatSafe(overview.EVToEBITDA),
      beta: parseFloatSafe(overview.Beta),
      "52WeekChange": undefined,
      pegRatio: parseFloatSafe(overview.PEGRatio),
    },
    incomeStatements: [],
    balanceSheets: [],
    cashflows: [],
    peers: [],
  };
}

class YahooFinanceService {
  async searchTicker(companyName: string): Promise<string | null> {
    const cacheKey = `yahoo:ticker:${companyName.toLowerCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const result = await (await yf()).search(companyName, {
            lang: "en-US",
            region: "US",
          });

          const equities = (result.quotes as YahooSearchResult[]).filter(
            (q) => q.quoteType === "EQUITY" || q.typeDisp === "Equity"
          );

          if (equities.length > 0) {
            return equities[0].symbol;
          }

          // Fallback: return first result if available
          if (result.quotes.length > 0) {
            return (result.quotes[0] as YahooSearchResult).symbol;
          }
        } catch (err) {
          logger.warn(`Yahoo Finance search failed for ${companyName}`, { err });
        }

        // Fallback to Alpha Vantage symbol search
        logger.info(`Yahoo Finance search failed or returned empty for ${companyName}. Falling back to Alpha Vantage...`);
        try {
          const avSymbol = await alphaVantageService.searchSymbol(companyName);
          if (avSymbol) {
            logger.info(`Successfully resolved ticker ${avSymbol} using Alpha Vantage for ${companyName}`);
            return avSymbol;
          }
        } catch (e) {
          logger.error(`Alpha Vantage symbol search fallback failed for ${companyName}`, { error: e });
        }

        return null;
      },
      config.cache.ttlFinancial
    );
  }

  async getFinancialData(ticker: string): Promise<YahooFinancialData> {
    const cacheKey = `yahoo:financials:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        logger.info(`Fetching Yahoo Finance data for ${ticker}`);

        const yfInstance = await yf();
        const [summaryResult, quoteResult] = await Promise.allSettled([
          yfInstance.quoteSummary(ticker, {
            modules: [
              "assetProfile",
              "financialData",
              "defaultKeyStatistics",
              "summaryDetail",
              "incomeStatementHistory",
              "balanceSheetHistory",
              "cashflowStatementHistory",
            ],
          }),
          yfInstance.quote(ticker),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary: any =
          summaryResult.status === "fulfilled" ? summaryResult.value : {};
        const quote =
          quoteResult.status === "fulfilled"
            ? (quoteResult.value as YahooQuoteResult)
            : null;

        if (!summary.financialData || !summary.financialData.totalRevenue) {
          logger.info(`Yahoo Finance data incomplete for ${ticker}. Falling back to Alpha Vantage...`);
          try {
            const overview = await alphaVantageService.getCompanyOverview(ticker);
            if (overview) {
              logger.info(`Successfully fetched Alpha Vantage fallback data for ${ticker}`);
              return mapAlphaVantageToYahoo(overview);
            }
          } catch (e) {
            logger.warn(`Alpha Vantage fallback failed for ${ticker}`, { error: e });
          }
        }

        const profile = summary.assetProfile || {};
        const financialData = summary.financialData || {};
        const keyStats = summary.defaultKeyStatistics || {};
        const summaryDetail = summary.summaryDetail || {};

        // Extract income statements
        const incomeStatements: IncomeStatement[] = (
          summary.incomeStatementHistory?.incomeStatementHistory || []
        ).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => ({
            endDate: s.endDate ? new Date(s.endDate) : undefined,
            totalRevenue: s.totalRevenue?.raw ?? s.totalRevenue,
            grossProfit: s.grossProfit?.raw ?? s.grossProfit,
            ebit: s.ebit?.raw ?? s.ebit,
            netIncome: s.netIncome?.raw ?? s.netIncome,
          })
        );

        // Extract balance sheets
        const balanceSheets: BalanceSheet[] = (
          summary.balanceSheetHistory?.balanceSheetStatements || []
        ).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => ({
            endDate: b.endDate ? new Date(b.endDate) : undefined,
            totalAssets: b.totalAssets?.raw ?? b.totalAssets,
            totalLiab: b.totalLiab?.raw ?? b.totalLiab,
            totalStockholderEquity:
              b.totalStockholderEquity?.raw ?? b.totalStockholderEquity,
            cash: b.cash?.raw ?? b.cash,
            longTermDebt: b.longTermDebt?.raw ?? b.longTermDebt,
          })
        );

        // Extract cashflow statements
        const cashflows: CashflowStatement[] = (
          summary.cashflowStatementHistory?.cashflowStatements || []
        ).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => ({
            endDate: c.endDate ? new Date(c.endDate) : undefined,
            totalCashFromOperatingActivities:
              c.totalCashFromOperatingActivities?.raw ??
              c.totalCashFromOperatingActivities,
            capitalExpenditures:
              c.capitalExpenditures?.raw ?? c.capitalExpenditures,
            freeCashFlow:
              c.freeCashFlow?.raw ??
              (c.totalCashFromOperatingActivities?.raw &&
              c.capitalExpenditures?.raw
                ? c.totalCashFromOperatingActivities.raw +
                  c.capitalExpenditures.raw // capex is negative
                : undefined),
          })
        );

        // Build peers list from recommendation trend if available
        const peers: string[] = [];

        return {
          quote,
          profile: {
            longBusinessSummary: profile.longBusinessSummary,
            website: profile.website,
            industry: profile.industry,
            sector: profile.sector,
            country: profile.country,
            city: profile.city,
            fullTimeEmployees: profile.fullTimeEmployees,
            companyOfficers: (profile.companyOfficers || []).slice(0, 5).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (o: any) => ({
                name: o.name,
                title: o.title,
              })
            ),
          },
          financial: {
            totalRevenue:
              financialData.totalRevenue?.raw ?? financialData.totalRevenue,
            grossMargins:
              financialData.grossMargins?.raw ?? financialData.grossMargins,
            operatingMargins:
              financialData.operatingMargins?.raw ??
              financialData.operatingMargins,
            profitMargins:
              financialData.profitMargins?.raw ?? financialData.profitMargins,
            returnOnEquity:
              financialData.returnOnEquity?.raw ?? financialData.returnOnEquity,
            debtToEquity:
              financialData.debtToEquity?.raw ?? financialData.debtToEquity,
            currentRatio:
              financialData.currentRatio?.raw ?? financialData.currentRatio,
            freeCashflow:
              financialData.freeCashflow?.raw ?? financialData.freeCashflow,
            revenueGrowth:
              financialData.revenueGrowth?.raw ?? financialData.revenueGrowth,
            earningsGrowth:
              financialData.earningsGrowth?.raw ?? financialData.earningsGrowth,
            targetMeanPrice:
              financialData.targetMeanPrice?.raw ??
              financialData.targetMeanPrice,
            recommendationKey: financialData.recommendationKey,
            numberOfAnalystOpinions:
              financialData.numberOfAnalystOpinions?.raw ??
              financialData.numberOfAnalystOpinions,
          },
          keyStats: {
            trailingPE:
              summaryDetail.trailingPE?.raw ??
              keyStats.trailingEps?.raw ??
              undefined,
            forwardPE:
              summaryDetail.forwardPE?.raw ?? keyStats.forwardPE?.raw,
            priceToBook: keyStats.priceToBook?.raw,
            enterpriseToEbitda: keyStats.enterpriseToEbitda?.raw,
            beta: summaryDetail.beta?.raw ?? keyStats.beta?.raw,
            "52WeekChange": keyStats["52WeekChange"]?.raw,
            pegRatio: keyStats.pegRatio?.raw,
          },
          incomeStatements,
          balanceSheets,
          cashflows,
          peers,
        };
      },
      config.cache.ttlFinancial
    );
  }

  async getPeers(ticker: string): Promise<string[]> {
    const cacheKey = `yahoo:peers:${ticker.toUpperCase()}`;
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result: any = await (await yf()).quoteSummary(ticker, {
            modules: ["summaryProfile" as never],
          });
          return [];
        } catch {
          return [];
        }
      },
      config.cache.ttlFinancial
    );
  }
}

export const yahooFinanceService = new YahooFinanceService();
