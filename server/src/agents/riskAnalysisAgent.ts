import { createLLM } from "../lib/llm";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { logger } from "../utils/logger";
import type { GraphState, RiskAnalysisOutput } from "../types";

const RiskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);

const RiskAnalysisSchema = z.object({
  overallRiskLevel: RiskLevelEnum.describe(
    "Overall risk classification for the investment"
  ),
  regulatoryRisks: z
    .array(z.string())
    .describe(
      "Specific regulatory, legal, or compliance risks (antitrust, data privacy, SEC, FDA, etc.)"
    ),
  marketRisks: z
    .array(z.string())
    .describe(
      "Market-related risks: interest rate sensitivity, inflation, currency, economic cycle"
    ),
  industryRisks: z
    .array(z.string())
    .describe(
      "Industry-specific risks: disruption, commoditization, technological shifts"
    ),
  companySpecificRisks: z
    .array(z.string())
    .describe(
      "Company-specific risks: key person dependency, customer concentration, debt levels, execution"
    ),
  macroRisks: z
    .array(z.string())
    .describe(
      "Macro-economic and geopolitical risks: recession, trade wars, supply chain"
    ),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Risk score 0-100 where LOWER score = LESS risk. 0-25: Low Risk, 26-50: Medium, 51-75: High, 76-100: Very High Risk"
    ),
  explanation: z
    .string()
    .describe(
      "2-3 sentence risk summary covering the most critical risk factors and overall risk assessment"
    ),
});

export async function riskAnalysisAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "Risk Analysis Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Analyzing risks for: ${state.companyName}`);

  try {
    const context = buildRiskContext(state);

    const llm = createLLM({ temperature: 0.1 });

    const structuredLlm = llm.withStructuredOutput(RiskAnalysisSchema, {
      name: "risk_analysis_output",
    });

    const messages = [
      new SystemMessage(
        `You are a senior risk analyst and portfolio manager specializing in equity risk assessment.
        Conduct a thorough risk analysis for the specified investment.
        
        Risk score interpretation (0-100, lower = less risky):
        - 0-25 (LOW): Blue-chip quality, stable business, limited downside scenarios
        - 26-50 (MEDIUM): Normal business risks, manageable challenges, some uncertainty
        - 51-75 (HIGH): Significant risks, meaningful uncertainty, requires risk tolerance
        - 76-100 (VERY HIGH): Major risks, speculative, high probability of significant loss
        
        Risk scoring factors:
        - High debt-to-equity (>2x): +15
        - Regulatory/legal issues: +15
        - Competitive threats: +10
        - Revenue concentration (>40% from 1 customer): +10
        - Negative cash flow: +15
        - Geopolitical exposure: +10
        - Disruptive technology risk: +10
        - Management uncertainty: +10
        
        Deduct for: diversification, strong moat, government contracts, recurring revenue, 
        net cash position, sector tailwinds.
        
        Be specific and actionable. Reference the actual data provided.`
      ),
      new HumanMessage(context),
    ];

    const result = await structuredLlm.invoke(messages);

    const output: RiskAnalysisOutput = {
      overallRiskLevel: result.overallRiskLevel,
      regulatoryRisks: result.regulatoryRisks,
      marketRisks: result.marketRisks,
      industryRisks: result.industryRisks,
      companySpecificRisks: result.companySpecificRisks,
      macroRisks: result.macroRisks,
      score: result.score,
      explanation: result.explanation,
    };

    const endTime = new Date();

    return {
      riskAnalysis: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Risk Level: ${output.overallRiskLevel} | Risk Score: ${output.score}/100`,
        },
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    const fallbackOutput: RiskAnalysisOutput = {
      overallRiskLevel: "MEDIUM",
      regulatoryRisks: [],
      marketRisks: [],
      industryRisks: [],
      companySpecificRisks: [],
      macroRisks: [],
      score: 50,
      explanation: isRateLimit
        ? "Risk analysis temporarily unavailable due to API rate limits. Medium risk level assumed. Please retry for accurate analysis."
        : `Risk analysis failed: ${errorMsg}`,
    };

    return {
      riskAnalysis: fallbackOutput,
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

function buildRiskContext(state: GraphState): string {
  const cr = state.companyResearch;
  const fa = state.financialAnalysis;
  const ns = state.newsSentiment;
  const ca = state.competitiveAnalysis;

  const sections: string[] = [
    `## Risk Analysis for ${state.companyName}
Ticker: ${cr?.ticker || "Unknown"}
Sector: ${cr?.sector || "Unknown"}
Industry: ${cr?.industry || "Unknown"}`,
  ];

  if (cr) {
    sections.push(`## Company Overview
Business Model: ${cr.businessModel}
Revenue Streams: ${cr.revenueStreams.join(", ")}
Market Cap: ${cr.marketCap ? "$" + (cr.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
Employees: ${cr.employees?.toLocaleString() || "N/A"}
Headquarters: ${cr.headquarters}`);
  }

  if (fa) {
    sections.push(`## Financial Risk Indicators
Revenue Growth: ${fa.revenueGrowthYoY?.toFixed(1) || "N/A"}% YoY
Gross Margin: ${fa.grossMargin?.toFixed(1) || "N/A"}%
Net Margin: ${fa.netMargin?.toFixed(1) || "N/A"}%
Debt-to-Equity: ${fa.debtToEquity?.toFixed(2) || "N/A"}
Current Ratio: ${fa.currentRatio?.toFixed(2) || "N/A"}
Free Cash Flow: ${fa.freeCashFlow != null ? "$" + (fa.freeCashFlow / 1e9).toFixed(2) + "B" : "N/A"}
Return on Equity: ${fa.roe?.toFixed(1) || "N/A"}%
P/E Ratio: ${fa.peRatio?.toFixed(1) || "N/A"}x`);
  }

  if (ns) {
    const negFactors = ns.negativeFactors.join("; ") || "None identified";
    sections.push(`## News & Sentiment Risks
Overall Sentiment: ${ns.overallSentiment}
Key Negative Factors: ${negFactors}`);
  }

  if (ca) {
    sections.push(`## Competitive Risks
Moat Strength: ${ca.moat}
Market Share: ${ca.marketShareEstimate}
Industry Trends: ${ca.industryTrends.join("; ")}
Competitive Position: ${ca.positionVsCompetitors}`);
  }

  sections.push(
    `\nConduct a comprehensive risk analysis covering all risk dimensions.
Consider regulatory, market, industry, company-specific, and macro risks.
Be specific and evidence-based in your risk identification.`
  );

  return sections.join("\n\n");
}
