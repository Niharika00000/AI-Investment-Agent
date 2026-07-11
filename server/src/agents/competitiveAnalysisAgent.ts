import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createLLM } from "../lib/llm";
import { finnhubService } from "../services/finnhubService";
import { logger } from "../utils/logger";
import type { GraphState, CompetitiveAnalysisOutput, Competitor } from "../types";

const CompetitiveAnalysisSchema = z.object({
  competitorNames: z
    .array(z.string())
    .describe("Top 3-5 main competitor company names (e.g., ['Microsoft', 'Google', 'Amazon'])"),
  competitorTickers: z
    .array(z.string())
    .describe("Stock ticker for each competitor in the same order as competitorNames (e.g., ['MSFT', 'GOOGL', 'AMZN'])"),
  competitorStrengths: z
    .array(z.string())
    .describe("Each entry is pipe-separated strengths for the corresponding competitor, e.g. 'Azure cloud dominance|Enterprise relationships'"),
  competitorWeaknesses: z
    .array(z.string())
    .describe("Each entry is pipe-separated weaknesses for the corresponding competitor, e.g. 'High cost|Slow innovation'"),
  competitorMarketCaps: z
    .array(z.string())
    .describe("Market cap comparison for each competitor, e.g. 'Larger by 2x', 'Similar size'"),
  competitiveAdvantages: z
    .array(z.string())
    .describe("Key competitive advantages the target company holds (moats, unique assets)"),
  moat: z
    .string()
    .describe("Assessment of economic moat: rate as None, Narrow, or Wide with brief explanation"),
  marketShareEstimate: z
    .string()
    .describe("Estimated market share in primary market (e.g., '~35% of global smartphone market')"),
  industryTrends: z
    .array(z.string())
    .describe("4-5 key industry trends that could impact the company"),
  positionVsCompetitors: z
    .string()
    .describe("2-3 sentence summary of the company's position versus its competitors"),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Competitive strength score 0-100 based on market position, moat, advantages, and industry trends"),
  explanation: z
    .string()
    .describe("2-3 sentence explanation of competitive position score, including key differentiators"),
});

export async function competitiveAnalysisAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "Competitive Analysis Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Analyzing competition for: ${state.companyName}`);

  try {
    const ticker = state.companyResearch?.ticker;

    // Get peer tickers from Finnhub
    let peers: string[] = [];
    if (ticker) {
      peers = await finnhubService.getPeers(ticker);
      peers = peers.filter((p) => p !== ticker).slice(0, 5);
    }

    const context = buildCompetitiveContext(state, peers);

    const llm = createLLM({ temperature: 0.2 });

    const structuredLlm = llm.withStructuredOutput(CompetitiveAnalysisSchema, {
      name: "competitive_analysis_output",
    });

    const messages = [
      new SystemMessage(
        `You are a senior strategy consultant and competitive intelligence expert.
        Analyze the competitive landscape for the specified company.
        
        Competitive strength scoring guide (0-100):
        - 85-100: Category-defining company, dominant market position, wide moat
        - 70-84: Strong competitive position with clear advantages
        - 55-69: Competitive but facing meaningful challenges, narrow moat
        - 40-54: Average competitive position, no clear moat
        - 25-39: Weak competitive position, losing market share
        - 0-24: Severe competitive disadvantage, existential threats
        
        Consider: market share, brand strength, switching costs, network effects, 
        patents/IP, cost advantages, distribution channels, and industry dynamics.
        
        Use your extensive knowledge of business strategy and current market conditions.`
      ),
      new HumanMessage(context),
    ];

    const result = await structuredLlm.invoke(messages);

    const competitors: Competitor[] = (result.competitorNames || []).map((name: string, i: number) => ({
      name,
      ticker: result.competitorTickers?.[i] ?? "",
      strengths: (result.competitorStrengths?.[i] ?? "").split("|").map((s: string) => s.trim()).filter(Boolean),
      weaknesses: (result.competitorWeaknesses?.[i] ?? "").split("|").map((s: string) => s.trim()).filter(Boolean),
      marketCapComparison: result.competitorMarketCaps?.[i] ?? "",
    }));

    const output: CompetitiveAnalysisOutput = {
      mainCompetitors: competitors,
      competitiveAdvantages: result.competitiveAdvantages,
      moat: result.moat,
      marketShareEstimate: result.marketShareEstimate,
      industryTrends: result.industryTrends,
      positionVsCompetitors: result.positionVsCompetitors,
      score: result.score,
      explanation: result.explanation,
    };

    const endTime = new Date();

    return {
      competitiveAnalysis: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Competitive score: ${output.score}/100 | Moat: ${output.moat} | ${competitors.length} competitors analyzed`,
        },
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    const fallbackOutput: CompetitiveAnalysisOutput = {
      mainCompetitors: [],
      competitiveAdvantages: [],
      moat: "Unknown",
      marketShareEstimate: "Unknown",
      industryTrends: [],
      positionVsCompetitors: isRateLimit
        ? "Competitive analysis temporarily unavailable due to API rate limits. Please retry."
        : `Analysis failed: ${errorMsg}`,
      score: 50,
      explanation: isRateLimit
        ? "Competitive position score estimated at 50/100 due to rate limits."
        : `Competitive analysis failed: ${errorMsg}`,
    };

    return {
      competitiveAnalysis: fallbackOutput,
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

function buildCompetitiveContext(state: GraphState, peers: string[]): string {
  const cr = state.companyResearch;
  const fa = state.financialAnalysis;

  const sections: string[] = [
    `## Competitive Analysis Request
Company: ${state.companyName}
Ticker: ${cr?.ticker || "Unknown"}
Sector: ${cr?.sector || "Unknown"}
Industry: ${cr?.industry || "Unknown"}
Known Peer Tickers (from Finnhub): ${peers.length > 0 ? peers.join(", ") : "None found"}`,
  ];

  if (cr) {
    sections.push(`## Company Profile
Business Model: ${cr.businessModel}
Key Products: ${cr.keyProducts.join(", ")}
Market Cap: ${cr.marketCap ? "$" + (cr.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
Description: ${cr.description}`);
  }

  if (fa) {
    sections.push(`## Financial Context (for comparison)
Revenue Growth: ${fa.revenueGrowthYoY?.toFixed(1) || "N/A"}% YoY
Gross Margin: ${fa.grossMargin?.toFixed(1) || "N/A"}%
Operating Margin: ${fa.operatingMargin?.toFixed(1) || "N/A"}%
P/E Ratio: ${fa.peRatio?.toFixed(1) || "N/A"}x`);
  }

  sections.push(
    `\nAnalyze the competitive landscape for ${state.companyName} in the ${cr?.industry || "relevant"} industry.
Identify the top 3-5 competitors, assess the competitive position, moat strength, and industry trends.`
  );

  return sections.join("\n\n");
}
