import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createLLM } from "../lib/llm";
import { logger } from "../utils/logger";
import type { GraphState, InvestmentDecisionOutput } from "../types";

const InvestmentDecisionSchema = z.object({
  decision: z
    .enum(["INVEST", "PASS"])
    .describe("Final investment recommendation: INVEST or PASS"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence in the recommendation as a percentage (0-100)"),
  reasoning: z
    .string()
    .describe(
      "Comprehensive 4-6 sentence reasoning for the investment decision, covering all key factors"
    ),
  keyBullishFactors: z
    .array(z.string())
    .describe("4-6 strongest bull case arguments for investing"),
  keyBearishFactors: z
    .array(z.string())
    .describe("3-5 strongest bear case arguments / reasons to be cautious"),
  priceTarget: z
    .string()
    .describe(
      "12-month price target or 'N/A' if cannot be determined (e.g., '$250-280')"
    ),
  timeHorizon: z
    .string()
    .describe(
      "Recommended holding period (e.g., 'Long-term (3-5 years)', 'Medium-term (1-2 years)')"
    ),
  riskRewardRatio: z
    .string()
    .describe(
      "Assessment of risk/reward profile (e.g., 'Favorable 3:1', 'Unfavorable 1:2')"
    ),
  summary: z
    .string()
    .describe(
      "1-2 sentence executive summary of the investment thesis for this company"
    ),
});

export async function investmentDecisionAgent(
  state: GraphState
): Promise<Partial<GraphState>> {
  const agentName = "Investment Decision Agent";
  const startTime = new Date();
  logger.info(`[${agentName}] Making final decision for: ${state.companyName}`);

  try {
    const context = buildDecisionContext(state);

    const llm = createLLM({ temperature: 0.1 });

    const structuredLlm = llm.withStructuredOutput(InvestmentDecisionSchema, {
      name: "investment_decision_output",
    });

    const messages = [
      new SystemMessage(
        `You are a legendary fund manager and investment committee chair with 30+ years of experience.
        Your role is to make the FINAL investment recommendation by synthesizing all research.
        
        Decision Framework:
        - Weigh all five analysis dimensions objectively
        - INVEST when: Total weighted score > 60 AND risks are manageable AND business fundamentals support appreciation
        - PASS when: Total weighted score < 60 OR risks are prohibitive OR valuation is excessive
        
        Confidence calculation:
        - Start at 50%
        - +20% if fundamental scores are all above 65
        - +10% if sentiment is strong (>70)
        - +15% if moat is Wide
        - -10% if any risk is VERY HIGH
        - -15% if financial score < 50
        - Maximum 95%, minimum 15%
        
        Weight each dimension:
        - Financial Health: 30%
        - Company Quality: 20%
        - Competitive Position: 20%
        - News Sentiment: 15%
        - Risk (inverse): 15%
        
        Be decisive, specific, and provide actionable intelligence.
        This decision should represent your highest conviction analysis.`
      ),
      new HumanMessage(context),
    ];

    const result = await structuredLlm.invoke(messages);

    const output: InvestmentDecisionOutput = {
      decision: result.decision,
      confidence: result.confidence,
      reasoning: result.reasoning,
      keyBullishFactors: result.keyBullishFactors,
      keyBearishFactors: result.keyBearishFactors,
      priceTarget: result.priceTarget,
      timeHorizon: result.timeHorizon,
      riskRewardRatio: result.riskRewardRatio,
      summary: result.summary,
    };

    const endTime = new Date();

    return {
      investmentDecision: output,
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "SUCCESS",
          summary: `Decision: ${result.decision} | Confidence: ${result.confidence}% | ${result.timeHorizon}`,
        },
      ],
    };
  } catch (err) {
    const endTime = new Date();
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[${agentName}] Failed`, { err });
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate");

    const cr = state.companyResearch;
    const fa = state.financialAnalysis;
    const ns = state.newsSentiment;
    const ca = state.competitiveAnalysis;
    const ra = state.riskAnalysis;
    const weightedScore = ((fa?.score ?? 50) * 0.3) + ((cr?.score ?? 50) * 0.2) +
      ((ca?.score ?? 50) * 0.2) + ((ns?.score ?? 50) * 0.15) + ((100 - (ra?.score ?? 50)) * 0.15);

    const fallbackOutput: InvestmentDecisionOutput = {
      decision: weightedScore >= 60 ? "INVEST" : "PASS",
      confidence: Math.round(Math.abs(weightedScore - 50) + 40),
      reasoning: isRateLimit
        ? `Investment decision computed from available agent scores (weighted average: ${weightedScore.toFixed(0)}/100) due to API rate limits. For a detailed analysis, please retry later.`
        : `Investment decision fallback due to error: ${errorMsg}`,
      keyBullishFactors: cr?.revenueStreams?.slice(0, 3) ?? [],
      keyBearishFactors: ra?.marketRisks?.slice(0, 3) ?? [],
      priceTarget: "N/A",
      timeHorizon: "Medium-term (1-2 years)",
      riskRewardRatio: weightedScore >= 60 ? "Favorable" : "Unfavorable",
      summary: `Based on available data, ${state.companyName} scores ${weightedScore.toFixed(0)}/100 on a weighted investment scale. ${weightedScore >= 60 ? "Investment opportunity identified." : "Not recommended at this time."}`,
    };

    return {
      investmentDecision: fallbackOutput,
      errors: [...state.errors, `${agentName}: ${errorMsg}`],
      agentTimeline: [
        ...state.agentTimeline,
        {
          agentName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          status: "FAILED",
          summary: isRateLimit ? `Rate limited - fallback decision: ${fallbackOutput.decision} (score: ${weightedScore.toFixed(0)})` : `Failed: ${errorMsg}`,
        },
      ],
    };
  }
}

function buildDecisionContext(state: GraphState): string {
  const cr = state.companyResearch;
  const fa = state.financialAnalysis;
  const ns = state.newsSentiment;
  const ca = state.competitiveAnalysis;
  const ra = state.riskAnalysis;

  const sections: string[] = [
    `## Investment Decision Analysis
Company: ${state.companyName}
Ticker: ${cr?.ticker || "Unknown"}
Sector: ${cr?.sector || "Unknown"}`,
  ];

  // Score summary
  const scores = {
    company: cr?.score ?? 0,
    financial: fa?.score ?? 0,
    sentiment: ns?.score ?? 0,
    competitive: ca?.score ?? 0,
    risk: ra?.score ?? 50,
  };

  const weightedScore =
    scores.financial * 0.3 +
    scores.company * 0.2 +
    scores.competitive * 0.2 +
    scores.sentiment * 0.15 +
    (100 - scores.risk) * 0.15;

  sections.push(`## Score Summary
Company Quality Score: ${scores.company}/100
Financial Health Score: ${scores.financial}/100
Sentiment Score: ${scores.sentiment}/100
Competitive Position Score: ${scores.competitive}/100
Risk Score: ${scores.risk}/100 (lower = less risky)
**Weighted Composite Score: ${weightedScore.toFixed(1)}/100**`);

  if (cr) {
    sections.push(`## Company Research Summary
${cr.description}
Business Model: ${cr.businessModel}
Revenue Streams: ${cr.revenueStreams.join(", ")}
Market Cap: ${cr.marketCap ? "$" + (cr.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
Quality Score Explanation: ${cr.explanation}`);
  }

  if (fa) {
    sections.push(`## Financial Health Summary
Revenue Growth YoY: ${fa.revenueGrowthYoY?.toFixed(1) || "N/A"}%
Gross Margin: ${fa.grossMargin?.toFixed(1) || "N/A"}%
Operating Margin: ${fa.operatingMargin?.toFixed(1) || "N/A"}%
Net Margin: ${fa.netMargin?.toFixed(1) || "N/A"}%
ROE: ${fa.roe?.toFixed(1) || "N/A"}%
Debt/Equity: ${fa.debtToEquity?.toFixed(2) || "N/A"}x
Free Cash Flow: ${fa.freeCashFlow != null ? "$" + (fa.freeCashFlow / 1e9).toFixed(2) + "B" : "N/A"}
P/E Ratio: ${fa.peRatio?.toFixed(1) || "N/A"}x
Financial Score Explanation: ${fa.explanation}`);
  }

  if (ns) {
    sections.push(`## News & Sentiment Summary
Overall: ${ns.overallSentiment} (Score: ${ns.score}/100)
Analyst Rating: ${ns.analystRating}
Positive Factors: ${ns.positiveFactors.join("; ")}
Negative Factors: ${ns.negativeFactors.join("; ")}
Sentiment Explanation: ${ns.explanation}`);
  }

  if (ca) {
    sections.push(`## Competitive Position Summary
Moat: ${ca.moat}
Market Share: ${ca.marketShareEstimate}
Key Advantages: ${ca.competitiveAdvantages.join("; ")}
Position vs Competitors: ${ca.positionVsCompetitors}
Competitive Score Explanation: ${ca.explanation}`);
  }

  if (ra) {
    sections.push(`## Risk Summary
Risk Level: ${ra.overallRiskLevel} (Score: ${ra.score}/100)
Key Regulatory Risks: ${ra.regulatoryRisks.slice(0, 3).join("; ")}
Key Market Risks: ${ra.marketRisks.slice(0, 2).join("; ")}
Key Company Risks: ${ra.companySpecificRisks.slice(0, 3).join("; ")}
Risk Explanation: ${ra.explanation}`);
  }

  sections.push(
    `\nMake the final investment decision for ${state.companyName}.
Synthesize all the research above into a clear INVEST or PASS recommendation with detailed reasoning.`
  );

  return sections.join("\n\n");
}
