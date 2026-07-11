import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createLLM } from "../lib/llm";
import { yahooFinanceService } from "../services/yahooFinanceService";
import { finnhubService } from "../services/finnhubService";
import { alphaVantageService } from "../services/alphaVantageService";
import { secEdgarService } from "../services/secEdgarService";
import { logger } from "../utils/logger";
import type { GraphState, CompanyResearchOutput } from "../types";

const CompanyResearchSchema = z.object({
  ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
  companyName: z.string().describe("Full official company name"),
  sector: z.string().describe("Business sector (e.g., Technology, Healthcare)"),
  industry: z.string().describe("Specific industry within the sector"),
  description: z.string().describe("Comprehensive company description (3-5 sentences)"),
  businessModel: z.string().describe("How the company makes money - its core business model"),
  revenueStreams: z.array(z.string()).describe("List of primary revenue streams"),
  keyProducts: z.array(z.string()).describe("Key products or services"),
  leadership: z
    .array(z.string())
    .describe("Key leaders formatted as 'Full Name (Job Title)' strings, e.g. 'Tim Cook (CEO)'"),
  marketCap: z.number().describe("Market capitalization in USD, or 0 if unknown"),
  employees: z.number().describe("Number of full-time employees, or 0 if unknown"),
  founded: z.string().describe("Year founded as a string, or 'Unknown'"),
  headquarters: z.string().describe("City and country of headquarters"),
  website: z.string().describe("Company website URL"),
  exchange: z.string().describe("Stock exchange (NYSE, NASDAQ, etc.)"),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall company quality score 0-100 based on brand, market position, and operations"),
  explanation: z
    .string()
    .describe("2-3 sentence explanation of the company quality score"),
});

export async function companyResearchAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "Company Research Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Starting research for: ${state.companyName}`);

  let ticker: string | null = null;
  let yahoo: any = null;
  let finnhub: any = null;
  let av: any = null;
  let cik: any = null;

  try {
    ticker = await yahooFinanceService.searchTicker(state.companyName);
    logger.info(`[${agentName}] Resolved ticker: ${ticker}`);

    const [yahooData, finnhubProfile, avOverview, secCik] = await Promise.allSettled([
      ticker ? yahooFinanceService.getFinancialData(ticker) : Promise.resolve(null),
      ticker ? finnhubService.getCompanyProfile(ticker) : Promise.resolve(null),
      ticker ? alphaVantageService.getCompanyOverview(ticker) : Promise.resolve(null),
      secEdgarService.findCik(ticker || state.companyName),
    ]);

    yahoo = yahooData.status === "fulfilled" ? yahooData.value : null;
    finnhub = finnhubProfile.status === "fulfilled" ? finnhubProfile.value : null;
    av = avOverview.status === "fulfilled" ? avOverview.value : null;
    cik = secCik.status === "fulfilled" ? secCik.value : null;

    const secInfo = cik ? await secEdgarService.getCompanyInfo(cik) : null;

    const companyContext = buildCompanyContext(state.companyName, ticker, yahoo, finnhub, av, secInfo);
    const llm = createLLM({ temperature: 0.1 });

    const structuredLlm = llm.withStructuredOutput(CompanyResearchSchema, {
      name: "company_research_output",
    });

    const messages = [
      new SystemMessage(
        `You are an expert financial analyst and company researcher. 
        Analyze the provided company data and produce a comprehensive research report.
        Be precise, data-driven, and objective. Use the provided data wherever available.
        If data is missing, use your knowledge to fill gaps but indicate uncertainty.`
      ),
      new HumanMessage(companyContext),
    ];

    const result = await structuredLlm.invoke(messages);

    const output: CompanyResearchOutput = {
      ticker: result.ticker || ticker || state.companyName.toUpperCase().slice(0, 5),
      companyName: result.companyName,
      sector: result.sector,
      industry: result.industry,
      description: result.description,
      businessModel: result.businessModel,
      revenueStreams: result.revenueStreams,
      keyProducts: result.keyProducts,
      leadership: result.leadership.map((entry: string) => {
        const match = entry.match(/^(.+?)\s*\((.+)\)$/);
        return match
          ? { name: match[1].trim(), title: match[2].trim() }
          : { name: entry, title: "" };
      }),
      marketCap: result.marketCap > 0 ? result.marketCap : null,
      employees: result.employees > 0 ? result.employees : null,
      founded: result.founded !== "Unknown" ? result.founded : null,
      headquarters: result.headquarters,
      website: result.website,
      exchange: result.exchange,
      score: result.score,
      explanation: result.explanation,
    };

    const endTime = new Date();

    return {
      companyResearch: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Researched ${output.companyName} (${output.ticker}) - Score: ${output.score}/100`,
        },
      ],
      sources: [
        ...state.sources,
        {
          name: "Yahoo Finance",
          url: `https://finance.yahoo.com/quote/${output.ticker}`,
          type: "FINANCIAL",
        },
        ...(finnhub?.weburl
          ? [{ name: output.companyName, url: finnhub.weburl, type: "OTHER" as const }]
          : []),
        ...(secInfo?.cik
          ? [{
              name: "SEC EDGAR",
              url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${secInfo.cik}&type=10-K&dateb=&owner=include&count=5`,
              type: "OTHER" as const,
            }]
          : []),
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    const resolvedTicker = ticker || av?.Symbol || yahoo?.quote?.symbol || state.companyName.toUpperCase().slice(0, 5);
    const resolvedName = av?.Name || yahoo?.quote?.shortName || yahoo?.quote?.longName || state.companyName;
    const resolvedSector = av?.Sector || yahoo?.profile?.sector || "Unknown";
    const resolvedIndustry = av?.Industry || yahoo?.profile?.industry || "Unknown";
    const resolvedDesc = av?.Description || yahoo?.profile?.longBusinessSummary || (isRateLimit ? `Company research temporarily unavailable due to API rate limits. Please retry in a few minutes.` : `Company research failed: ${errorMsg}`);
    const resolvedWebsite = av?.OfficialSite || yahoo?.profile?.website || `https://www.google.com/search?q=${encodeURIComponent(state.companyName)}`;
    const resolvedMarketCap = yahoo?.quote?.marketCap || (av?.MarketCapitalization ? parseFloat(av.MarketCapitalization) : 0);
    const resolvedEmployees = yahoo?.profile?.fullTimeEmployees || 0;
    const resolvedExchange = av?.Exchange || yahoo?.quote?.exchange || "Unknown";
    const resolvedHQ = av?.Address || (yahoo?.profile?.city ? `${yahoo.profile.city}, ${yahoo.profile.country || ""}` : "Unknown");
    const resolvedFounded = av?.Founded || "Unknown";
    const resolvedOfficers = (yahoo?.profile?.companyOfficers || []).map((o: any) => ({ name: o.name || "", title: o.title || "" }));

    const fallbackOutput: CompanyResearchOutput = {
      ticker: resolvedTicker,
      companyName: resolvedName,
      sector: resolvedSector,
      industry: resolvedIndustry,
      description: resolvedDesc,
      businessModel: av?.Description ? "B2B / B2C diversified product/service model." : "Information unavailable",
      revenueStreams: av?.Sector ? [av.Sector + " operations"] : [],
      keyProducts: av?.Industry ? [av.Industry + " solutions"] : [],
      leadership: resolvedOfficers.length > 0 ? resolvedOfficers : [],
      marketCap: resolvedMarketCap,
      employees: resolvedEmployees,
      founded: resolvedFounded,
      headquarters: resolvedHQ,
      website: resolvedWebsite,
      exchange: resolvedExchange,
      score: 60,
      explanation: `[Quota Fallback] Company profile resolved deterministically due to AI rate limits. ${resolvedName} is listed on ${resolvedExchange} with a market capitalization of $${resolvedMarketCap ? (resolvedMarketCap / 1e9).toFixed(2) + "B" : "N/A"}.`,
    };

    return {
      companyResearch: fallbackOutput,
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

function buildCompanyContext(
  companyName: string,
  ticker: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yahoo: any,
  finnhub: any,
  av: any,
  secInfo: any
): string {
  const sections: string[] = [
    `## Company Research Request\nCompany: ${companyName}\nTicker: ${ticker || "Unknown"}`,
  ];

  if (yahoo?.profile) {
    sections.push(`## Yahoo Finance Profile
Industry: ${yahoo.profile.industry || "N/A"}
Sector: ${yahoo.profile.sector || "N/A"}
Employees: ${yahoo.profile.fullTimeEmployees?.toLocaleString() || "N/A"}
Website: ${yahoo.profile.website || "N/A"}
Location: ${yahoo.profile.city || ""}, ${yahoo.profile.country || ""}
Description: ${yahoo.profile.longBusinessSummary || "N/A"}
Leadership: ${(yahoo.profile.companyOfficers || []).map((o: { name?: string; title?: string }) => `${o.name} (${o.title})`).join(", ") || "N/A"}`);
  }

  if (yahoo?.quote) {
    sections.push(`## Market Data
Exchange: ${yahoo.quote.exchange || "N/A"}
Market Cap: $${yahoo.quote.marketCap ? (yahoo.quote.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
Current Price: $${yahoo.quote.regularMarketPrice || "N/A"}`);
  }

  if (finnhub && Object.keys(finnhub).length > 0) {
    sections.push(`## Finnhub Data
Country: ${finnhub.country || "N/A"}
IPO Date: ${finnhub.ipo || "N/A"}
Industry: ${finnhub.finnhubIndustry || "N/A"}`);
  }

  if (av?.Description) {
    sections.push(`## Alpha Vantage Overview
Name: ${av.Name || "N/A"}
Description: ${av.Description}
Sector: ${av.Sector || "N/A"}
Industry: ${av.Industry || "N/A"}
Exchange: ${av.Exchange || "N/A"}`);
  }

  if (secInfo) {
    const recent10K = secInfo.recentFilings.find((f: { form: string }) => f.form === "10-K");
    sections.push(`## SEC EDGAR Registration
CIK: ${secInfo.cik}
Legal Name: ${secInfo.name}
SIC Code: ${secInfo.sic} (${secInfo.sicDescription})
State of Incorporation: ${secInfo.stateOfIncorporation}
Fiscal Year End: ${secInfo.fiscalYearEnd}
${recent10K ? `Latest 10-K Filed: ${recent10K.filingDate}` : ""}`);
  }

  sections.push(
    `\nBased on all available data above, provide a comprehensive company research analysis for ${companyName}.`
  );

  return sections.join("\n\n");
}
