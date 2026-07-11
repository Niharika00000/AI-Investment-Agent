/**
 * SEC EDGAR Service
 *
 * Provides free access to company filings and fundamentals via the SEC EDGAR
 * public REST API (no API key required).
 *
 * Endpoints used:
 *   https://data.sec.gov/submissions/{CIK}.json      — company metadata + recent filings
 *   https://data.sec.gov/api/xbrl/companyfacts/{CIK}.json — XBRL financial facts
 *   https://efts.sec.gov/LATEST/search-index?q=...   — full-text search
 *
 * Rate limit: max 10 req/s per SEC fair-use policy.
 */

import axios from "axios";
import { cacheService } from "./cacheService";
import { logger } from "../utils/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  form: string;       // "10-K", "10-Q", "8-K", …
  primaryDocument: string;
  reportDate: string | null;
}

export interface SECCompanyInfo {
  cik: string;
  name: string;
  sic: string;
  sicDescription: string;
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  recentFilings: SECFiling[];
}

export interface SECFinancialFact {
  /** Values reported in quarterly / annual periods */
  values: Array<{
    end: string;   // "2024-12-31"
    val: number;
    form: string;  // "10-K" | "10-Q"
    filed: string;
    accn: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = "https://data.sec.gov";
const EFTS = "https://efts.sec.gov";

/** Pad CIK to 10 digits with leading zeros as required by SEC API. */
function padCik(cik: string | number): string {
  return String(cik).padStart(10, "0");
}

const httpClient = axios.create({
  timeout: 15_000,
  headers: {
    // SEC requires a descriptive User-Agent to identify the requesting application.
    "User-Agent": "AI-Investment-Research-Agent research@example.com",
    "Accept-Encoding": "gzip, deflate",
  },
});

// ─── Service ──────────────────────────────────────────────────────────────────

class SecEdgarService {
  /**
   * Search for a company's CIK by ticker symbol or company name.
   * Uses the EDGAR company search endpoint.
   */
  async findCik(query: string): Promise<string | null> {
    const cacheKey = `sec:cik:${query.toLowerCase()}`;
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    try {
      // EDGAR ticker-to-CIK lookup
      const url = `${BASE}/submissions/`;
      const tickerUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(query)}&type=10-K&dateb=&owner=include&count=5&search_text=&output=atom`;

      // Prefer exact ticker lookup via the tickers JSON file (fast, authoritative)
      const tickersResp = await httpClient.get<Record<string, { cik_str: number; ticker: string; title: string }>>(
        "https://www.sec.gov/files/company_tickers.json"
      );

      const tickers = tickersResp.data;
      const upperQuery = query.toUpperCase();

      // Try exact ticker match first
      const tickerMatch = Object.values(tickers).find(
        (c) => c.ticker.toUpperCase() === upperQuery
      );
      if (tickerMatch) {
        const cik = padCik(tickerMatch.cik_str);
        cacheService.set(cacheKey, cik);
        return cik;
      }

      // Fallback: partial name match
      const nameMatch = Object.values(tickers).find(
        (c) => c.title.toUpperCase().includes(upperQuery)
      );
      if (nameMatch) {
        const cik = padCik(nameMatch.cik_str);
        cacheService.set(cacheKey, cik);
        return cik;
      }

      return null;
    } catch (err) {
      logger.warn("[SecEdgarService] findCik failed", { query, err });
      return null;
    }
  }

  /**
   * Fetch company metadata and list of recent SEC filings for a given CIK.
   */
  async getCompanyInfo(cik: string): Promise<SECCompanyInfo | null> {
    const paddedCik = padCik(cik);
    const cacheKey = `sec:info:${paddedCik}`;
    const cached = cacheService.get<SECCompanyInfo>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await httpClient.get<any>(
        `${BASE}/submissions/CIK${paddedCik}.json`
      );

      const recentFilings: SECFiling[] = [];
      const filings = data.filings?.recent;
      if (filings) {
        const count = Math.min(filings.accessionNumber?.length ?? 0, 20);
        for (let i = 0; i < count; i++) {
          recentFilings.push({
            accessionNumber: filings.accessionNumber[i],
            filingDate: filings.filingDate[i],
            form: filings.form[i],
            primaryDocument: filings.primaryDocument[i],
            reportDate: filings.reportDate?.[i] ?? null,
          });
        }
      }

      const result: SECCompanyInfo = {
        cik: paddedCik,
        name: data.name ?? "",
        sic: data.sic ?? "",
        sicDescription: data.sicDescription ?? "",
        stateOfIncorporation: data.stateOfIncorporation ?? "",
        fiscalYearEnd: data.fiscalYearEnd ?? "",
        recentFilings,
      };

      cacheService.set(cacheKey, result, 3600 * 6); // 6 hr
      return result;
    } catch (err) {
      logger.warn("[SecEdgarService] getCompanyInfo failed", { cik, err });
      return null;
    }
  }

  /**
   * Fetch annual (10-K) revenue (us-gaap/Revenues or RevenueFromContractWithCustomer)
   * for the last N years.
   */
  async getAnnualRevenue(
    cik: string,
    years = 5
  ): Promise<Array<{ year: number; revenue: number }>> {
    const paddedCik = padCik(cik);
    const cacheKey = `sec:revenue:${paddedCik}`;
    const cached = cacheService.get<Array<{ year: number; revenue: number }>>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await httpClient.get<any>(
        `${BASE}/api/xbrl/companyfacts/CIK${paddedCik}.json`
      );

      // Try several GAAP concepts in order of preference
      const concepts = [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
        "RevenueFromContractWithCustomer",
      ];

      let units: any[] = [];
      for (const concept of concepts) {
        const raw = data?.facts?.["us-gaap"]?.[concept]?.units?.USD;
        if (raw?.length) {
          units = raw;
          break;
        }
      }

      // Filter to annual (10-K) filings only and deduplicate by fiscal year
      const annualMap = new Map<number, number>();
      for (const entry of units) {
        if (entry.form === "10-K" && entry.end) {
          const year = parseInt(entry.end.substring(0, 4), 10);
          annualMap.set(year, entry.val);
        }
      }

      const result = Array.from(annualMap.entries())
        .sort(([a], [b]) => a - b)
        .slice(-years)
        .map(([year, revenue]) => ({ year, revenue }));

      cacheService.set(cacheKey, result, 3600 * 6);
      return result;
    } catch (err) {
      logger.warn("[SecEdgarService] getAnnualRevenue failed", { cik, err });
      return [];
    }
  }

  /**
   * Get the most recent annual report (10-K) filing details.
   */
  async getLatest10K(cik: string): Promise<SECFiling | null> {
    try {
      const info = await this.getCompanyInfo(cik);
      if (!info) return null;
      return (
        info.recentFilings.find((f) => f.form === "10-K") ?? null
      );
    } catch (err) {
      logger.warn("[SecEdgarService] getLatest10K failed", { cik, err });
      return null;
    }
  }

  /**
   * Full-text search across all SEC filings for a company name or keyword.
   * Useful for finding risk-factor disclosures, 8-K material events, etc.
   */
  async searchFilings(
    query: string,
    forms: string[] = ["8-K", "10-K"],
    limit = 5
  ): Promise<Array<{ title: string; filingDate: string; form: string; url: string }>> {
    const cacheKey = `sec:search:${query}:${forms.join(",")}`;
    const cached = cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await httpClient.get<any>(
        `${EFTS}/LATEST/search-index`,
        {
          params: {
            q: `"${query}"`,
            dateRange: "custom",
            startdt: new Date(Date.now() - 365 * 24 * 3600 * 1000)
              .toISOString()
              .slice(0, 10),
            forms: forms.join(","),
          },
        }
      );

      const hits = (data?.hits?.hits ?? []).slice(0, limit);
      const result = hits.map((hit: any) => ({
        title: hit._source?.display_names?.[0]?.name ?? hit._source?.entity_name ?? query,
        filingDate: hit._source?.file_date ?? "",
        form: hit._source?.form_type ?? "",
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${hit._source?.entity_id}&type=${hit._source?.form_type}&dateb=&owner=include&count=5`,
      }));

      cacheService.set(cacheKey, result, 1800); // 30 min
      return result;
    } catch (err) {
      logger.warn("[SecEdgarService] searchFilings failed", { query, err });
      return [];
    }
  }
}

export const secEdgarService = new SecEdgarService();
