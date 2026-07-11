import { createLLM } from "../lib/llm";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { yahooFinanceService } from "../services/yahooFinanceService";
import { logger } from "../utils/logger";
import type { GraphState, FinancialAnalysisOutput } from "../types";

const FinancialAnalysisSchema = z.object({
  revenueGrowthYoY: z.number().describe("Year-over-year revenue growth as a percentage (e.g., 15.5 for 15.5%). Use 0 if unknown."),
  revenueGrowthQoQ: z.number().describe("Quarter-over-quarter revenue growth as a percentage. Use 0 if unknown."),
  grossMargin: z.number().describe("Gross profit margin as a percentage (e.g., 72.3 for 72.3%). Use 0 if unknown."),
  operatingMargin: z.number().describe("Operating profit margin as a percentage. Use 0 if unknown."),
  netMargin: z.number().describe("Net profit margin as a percentage. Use 0 if unknown."),
  roe: z.number().describe("Return on equity as a percentage. Use 0 if unknown."),
  debtToEquity: z.number().describe("Debt-to-equity ratio. Use -1 if not applicable."),
  currentRatio: z.number().describe("Current ratio (current assets / current liabilities). Use 0 if unknown."),
  freeCashFlow: z.number().describe("Free cash flow in USD (raw value like 107000000000). Use 0 if unknown."),
  peRatio: z.number().describe("Price-to-earnings ratio (trailing). Use 0 if unknown or negative."),
  pbRatio: z.number().describe("Price-to-book ratio. Use 0 if unknown."),
  evEbitda: z.number().describe("Enterprise value to EBITDA ratio. Use 0 if unknown."),
  revenueHistory: z
    .array(z.string())
    .describe("Revenue by fiscal year as strings in format 'YYYY:AMOUNT' (e.g., '2024:383000000000'). Most recent first. Include 3-5 years."),
  earningsHistory: z
    .array(z.string())
    .describe("Net income by fiscal year as strings in format 'YYYY:AMOUNT' (e.g., '2024:96000000000'). Most recent first. Include 3-5 years."),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Financial health score 0-100. Consider revenue growth, margins, debt levels, cash generation, and valuation."),
  explanation: z
    .string()
    .describe("3-4 sentence analysis of financial health covering growth, profitability, balance sheet strength, and valuation"),
});


export async function financialAnalysisAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "Financial Analysis Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Analyzing financials for: ${state.companyName}`);

  let ticker: string | undefined;
  let financialData: any = null;

  try {
    ticker = state.companyResearch?.ticker;

    if (!ticker) {
      throw new Error("No ticker symbol available from company research");
    }

    // Fetch comprehensive financial data
    financialData = await yahooFinanceService.getFinancialData(ticker);

    // Build financial context for LLM
    const context = buildFinancialContext(ticker, financialData);

    const llm = createLLM({ temperature: 0.1 });

    const structuredLlm = llm.withStructuredOutput(FinancialAnalysisSchema, {
      name: "financial_analysis_output",
    });

    const messages = [
      new SystemMessage(
        `You are a senior financial analyst specializing in equity research and investment analysis.
        Analyze the provided financial data thoroughly and produce a detailed financial health assessment.
        
        Scoring guide for financial health (0-100):
        - Revenue growth >20% YoY: +20 points
        - Gross margins >60%: +15 points  
        - Positive and growing free cash flow: +15 points
        - Low debt-to-equity (<1.0): +10 points
        - Strong ROE (>15%): +10 points
        - Current ratio >1.5: +10 points
        - Reasonable valuation (P/E < industry average): +10 points
        - Operating margin >15%: +10 points
        
        Deduct points for: negative growth, high debt, poor margins, negative cash flow.
        Use precise numbers from the data provided. Express all percentages as numbers (15.5 not 0.155).`
      ),
      new HumanMessage(context),
    ];

    const result = await structuredLlm.invoke(messages);

    const parseHistory = (entries: string[] = [], key: string) =>
      entries.map((e) => {
        const [period, val] = e.split(":");
        return { period: period?.trim() ?? "", [key]: parseFloat(val ?? "0") || 0 };
      });

    const output: FinancialAnalysisOutput = {
      revenueGrowthYoY: result.revenueGrowthYoY || null,
      revenueGrowthQoQ: result.revenueGrowthQoQ || null,
      grossMargin: result.grossMargin || null,
      operatingMargin: result.operatingMargin || null,
      netMargin: result.netMargin || null,
      roe: result.roe || null,
      debtToEquity: result.debtToEquity >= 0 ? result.debtToEquity : null,
      currentRatio: result.currentRatio || null,
      freeCashFlow: result.freeCashFlow || null,
      peRatio: result.peRatio || null,
      pbRatio: result.pbRatio || null,
      evEbitda: result.evEbitda || null,
      revenueHistory: parseHistory(result.revenueHistory, "revenue") as any,
      earningsHistory: parseHistory(result.earningsHistory, "earnings") as any,
      score: result.score,
      explanation: result.explanation,
    };

    const endTime = new Date();

    return {
      financialAnalysis: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Financial health score: ${output.score}/100 | Revenue Growth: ${output.revenueGrowthYoY?.toFixed(1) ?? "N/A"}%`,
        },
      ],
      sources: [
        ...state.sources,
        {
          name: "Yahoo Finance Financials",
          url: `https://finance.yahoo.com/quote/${ticker}/financials`,
          type: "FINANCIAL",
        },
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    if (financialData && ticker) {
      logger.info(`[${agentName}] Attempting deterministic fallback parsing for ${ticker} due to LLM error`);
      try {
        const fallbackOutput = parseFinancialsDeterministically(ticker, financialData, errorMsg);
        return {
          financialAnalysis: fallbackOutput,
          agentTimeline: [
            ...state.agentTimeline,
            {
              agentName,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              durationMs: endTime.getTime() - startTime.getTime(),
              status: "SUCCESS",
              summary: `Financial health score: ${fallbackOutput.score}/100 | Resolved deterministically (API Quota Fallback)`,
            },
          ],
        };
      } catch (fallbackErr) {
        logger.error(`[${agentName}] Deterministic fallback parsing failed`, { fallbackErr });
      }
    }

    const fallbackOutput: FinancialAnalysisOutput = {
      revenueGrowthYoY: null,
      revenueGrowthQoQ: null,
      grossMargin: null,
      operatingMargin: null,
      netMargin: null,
      roe: null,
      debtToEquity: null,
      currentRatio: null,
      freeCashFlow: null,
      peRatio: null,
      pbRatio: null,
      evEbitda: null,
      revenueHistory: [],
      earningsHistory: [],
      score: 50,
      explanation: isRateLimit
        ? `Financial analysis temporarily unavailable due to API rate limits. Score estimated at 50/100 (neutral). Please retry in a few minutes for detailed analysis.`
        : `Financial analysis could not be completed: ${errorMsg}.`,
    };

    return {
      financialAnalysis: fallbackOutput,
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

function parseFinancialsDeterministically(ticker: string, data: any, errorMsg: string): FinancialAnalysisOutput {
  const f = data?.financial || {};
  const k = data?.keyStats || {};
  const income = data?.incomeStatements || [];

  const parseFloatSafe = (val: any) => {
    if (val === undefined || val === null || val === "None" || val === "N/A") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const toPercent = (val: number | null | undefined) => {
    if (val == null) return null;
    return val > -1.0 && val < 1.0 ? val * 100 : val;
  };

  const revenueGrowthYoY = toPercent(parseFloatSafe(f.revenueGrowth));
  const grossMargin = toPercent(parseFloatSafe(f.grossMargins));
  const operatingMargin = toPercent(parseFloatSafe(f.operatingMargins));
  const netMargin = toPercent(parseFloatSafe(f.profitMargins));
  const roe = toPercent(parseFloatSafe(f.returnOnEquity));
  const debtToEquity = parseFloatSafe(f.debtToEquity);
  const currentRatio = parseFloatSafe(f.currentRatio);
  const freeCashFlow = parseFloatSafe(f.freeCashflow);
  const peRatio = parseFloatSafe(k.trailingPE);
  const pbRatio = parseFloatSafe(k.priceToBook);
  const evEbitda = parseFloatSafe(k.enterpriseToEbitda);

  // Map history
  const revenueHistory = income.slice(0, 4).map((s: any) => ({
    period: s.endDate ? new Date(s.endDate).getFullYear().toString() : "N/A",
    revenue: s.totalRevenue || 0
  })).filter((x: any) => x.period !== "N/A");

  const earningsHistory = income.slice(0, 4).map((s: any) => ({
    period: s.endDate ? new Date(s.endDate).getFullYear().toString() : "N/A",
    earnings: s.netIncome || 0
  })).filter((x: any) => x.period !== "N/A");

  // Calculate score deterministically based on key factors
  let score = 50;
  if (revenueGrowthYoY != null) score += revenueGrowthYoY > 20 ? 15 : revenueGrowthYoY > 10 ? 10 : revenueGrowthYoY < 0 ? -15 : 0;
  if (grossMargin != null) score += grossMargin > 60 ? 15 : grossMargin > 40 ? 10 : 0;
  if (operatingMargin != null) score += operatingMargin > 15 ? 10 : operatingMargin > 5 ? 5 : 0;
  if (roe != null) score += roe > 15 ? 10 : roe > 8 ? 5 : 0;
  if (currentRatio != null) score += currentRatio > 1.5 ? 10 : currentRatio < 1.0 ? -10 : 0;
  if (debtToEquity != null) score += debtToEquity < 1.0 ? 10 : debtToEquity > 2.0 ? -15 : 0;
  score = Math.min(100, Math.max(0, score));

  const explanation = `[Quota Fallback] Financial statistics parsed deterministically for ${ticker} due to AI quota limits. Gross margin is ${grossMargin?.toFixed(1) || "N/A"}% (operating: ${operatingMargin?.toFixed(1) || "N/A"}%). Revenue growth is ${revenueGrowthYoY?.toFixed(1) || "N/A"}% YoY, and trailing P/E is ${peRatio?.toFixed(1) || "N/A"}x. Current ratio is ${currentRatio?.toFixed(1) || "N/A"} and return on equity (ROE) is ${roe?.toFixed(1) || "N/A"}%.`;

  return {
    revenueGrowthYoY,
    revenueGrowthQoQ: toPercent(parseFloatSafe(f.earningsGrowth)) || null,
    grossMargin,
    operatingMargin,
    netMargin,
    roe,
    debtToEquity,
    currentRatio,
    freeCashFlow,
    peRatio,
    pbRatio,
    evEbitda,
    revenueHistory,
    earningsHistory,
    score,
    explanation,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFinancialContext(ticker: string, data: any): string {
  if (!data) {
    return `No financial data available for ${ticker}. Please use your knowledge to estimate financial metrics.`;
  }

  const f = data.financial || {};
  const k = data.keyStats || {};
  const income = data.incomeStatements || [];
  const balance = data.balanceSheets || [];
  const cashflow = data.cashflows || [];

  const fmt = (val: number | undefined, suffix = "") =>
    val != null ? `${(val / 1e9).toFixed(2)}B${suffix}` : "N/A";
  const fmtPct = (val: number | undefined) =>
    val != null ? `${(val * 100).toFixed(2)}%` : "N/A";

  const sections: string[] = [
    `## Financial Analysis for ${ticker}`,
    `### Key Financial Metrics
Total Revenue (TTM): ${fmt(f.totalRevenue)}
Revenue Growth YoY: ${fmtPct(f.revenueGrowth)}
Earnings Growth YoY: ${fmtPct(f.earningsGrowth)}
Gross Margin: ${fmtPct(f.grossMargins)}
Operating Margin: ${fmtPct(f.operatingMargins)}
Net Profit Margin: ${fmtPct(f.profitMargins)}
Free Cash Flow: ${fmt(f.freeCashflow)}
Return on Equity: ${fmtPct(f.returnOnEquity)}
Debt-to-Equity: ${f.debtToEquity != null ? f.debtToEquity.toFixed(2) : "N/A"}
Current Ratio: ${f.currentRatio != null ? f.currentRatio.toFixed(2) : "N/A"}
Analyst Target Price: $${f.targetMeanPrice?.toFixed(2) || "N/A"}
Analyst Recommendation: ${f.recommendationKey || "N/A"}
Number of Analysts: ${f.numberOfAnalystOpinions || "N/A"}`,

    `### Valuation Metrics
Trailing P/E: ${k.trailingPE?.toFixed(2) || "N/A"}
Forward P/E: ${k.forwardPE?.toFixed(2) || "N/A"}
Price-to-Book: ${k.priceToBook?.toFixed(2) || "N/A"}
EV/EBITDA: ${k.enterpriseToEbitda?.toFixed(2) || "N/A"}
Beta: ${k.beta?.toFixed(2) || "N/A"}
52-Week Change: ${k["52WeekChange"] != null ? (k["52WeekChange"] * 100).toFixed(2) + "%" : "N/A"}
PEG Ratio: ${k.pegRatio?.toFixed(2) || "N/A"}`,
  ];

  if (income.length > 0) {
    const revenueTable = income
      .slice(0, 4)
      .map((s: { endDate?: Date; totalRevenue?: number; grossProfit?: number; netIncome?: number }) =>
        `${s.endDate?.getFullYear() || "N/A"}: Revenue=${fmt(s.totalRevenue)}, Gross Profit=${fmt(s.grossProfit)}, Net Income=${fmt(s.netIncome)}`
      )
      .join("\n");
    sections.push(`### Income Statement History\n${revenueTable}`);
  }

  if (balance.length > 0) {
    const balanceTable = balance
      .slice(0, 3)
      .map((b: { endDate?: Date; totalAssets?: number; totalLiab?: number; totalStockholderEquity?: number; longTermDebt?: number }) =>
        `${b.endDate?.getFullYear() || "N/A"}: Assets=${fmt(b.totalAssets)}, Liabilities=${fmt(b.totalLiab)}, Equity=${fmt(b.totalStockholderEquity)}, LT Debt=${fmt(b.longTermDebt)}`
      )
      .join("\n");
    sections.push(`### Balance Sheet History\n${balanceTable}`);
  }

  if (cashflow.length > 0) {
    const cashTable = cashflow
      .slice(0, 3)
      .map((c: { endDate?: Date; totalCashFromOperatingActivities?: number; capitalExpenditures?: number }) =>
        `${c.endDate?.getFullYear() || "N/A"}: Operating CF=${fmt(c.totalCashFromOperatingActivities)}, CapEx=${fmt(c.capitalExpenditures)}`
      )
      .join("\n");
    sections.push(`### Cash Flow History\n${cashTable}`);
  }

  return sections.join("\n\n");
}
