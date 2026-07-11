import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { companyResearchAgent } from "../agents/companyResearchAgent";
import { financialAnalysisAgent } from "../agents/financialAnalysisAgent";
import { newsSentimentAgent } from "../agents/newsSentimentAgent";
import { competitiveAnalysisAgent } from "../agents/competitiveAnalysisAgent";
import { riskAnalysisAgent } from "../agents/riskAnalysisAgent";
import { investmentDecisionAgent } from "../agents/investmentDecisionAgent";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import type {
  GraphState,
  CompanyResearchOutput,
  FinancialAnalysisOutput,
  NewsSentimentOutput,
  CompetitiveAnalysisOutput,
  RiskAnalysisOutput,
  InvestmentDecisionOutput,
  AgentTimelineEntry,
  SourceEntry,
  InvestmentReport,
} from "../types";

const InvestmentGraphState = Annotation.Root({
  companyName: Annotation<string>({
    reducer: (_x: string, y: string) => y,
    default: () => "",
  }),
  requestId: Annotation<string>({
    reducer: (_x: string, y: string) => y,
    default: () => "",
  }),
  companyResearch: Annotation<CompanyResearchOutput | null>({
    reducer: (_x: CompanyResearchOutput | null, y: CompanyResearchOutput | null) => y,
    default: () => null,
  }),
  financialAnalysis: Annotation<FinancialAnalysisOutput | null>({
    reducer: (_x: FinancialAnalysisOutput | null, y: FinancialAnalysisOutput | null) => y,
    default: () => null,
  }),
  newsSentiment: Annotation<NewsSentimentOutput | null>({
    reducer: (_x: NewsSentimentOutput | null, y: NewsSentimentOutput | null) => y,
    default: () => null,
  }),
  competitiveAnalysis: Annotation<CompetitiveAnalysisOutput | null>({
    reducer: (_x: CompetitiveAnalysisOutput | null, y: CompetitiveAnalysisOutput | null) => y,
    default: () => null,
  }),
  riskAnalysis: Annotation<RiskAnalysisOutput | null>({
    reducer: (_x: RiskAnalysisOutput | null, y: RiskAnalysisOutput | null) => y,
    default: () => null,
  }),
  investmentDecision: Annotation<InvestmentDecisionOutput | null>({
    reducer: (_x: InvestmentDecisionOutput | null, y: InvestmentDecisionOutput | null) => y,
    default: () => null,
  }),
  agentTimeline: Annotation<AgentTimelineEntry[]>({
    reducer: (x: AgentTimelineEntry[], y: AgentTimelineEntry[]) => [...x, ...y.filter(e => !x.some(xe => xe.agentName === e.agentName))],
    default: () => [],
  }),
  sources: Annotation<SourceEntry[]>({
    reducer: (x: SourceEntry[], y: SourceEntry[]) => {
      const existing = new Set(x.map(s => s.url));
      const newSources = y.filter(s => !existing.has(s.url));
      return [...x, ...newSources];
    },
    default: () => [],
  }),
  errors: Annotation<string[]>({
    reducer: (x: string[], y: string[]) => [...x, ...y],
    default: () => [],
  }),
});

type InvestmentGraphStateType = typeof InvestmentGraphState.State;

async function companyResearchNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return companyResearchAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

async function financialAnalysisNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return financialAnalysisAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

async function newsSentimentNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return newsSentimentAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

async function competitiveAnalysisNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return competitiveAnalysisAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

async function riskAnalysisNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return riskAnalysisAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

async function investmentDecisionNode(
  state: InvestmentGraphStateType
): Promise<Partial<InvestmentGraphStateType>> {
  return investmentDecisionAgent(state as GraphState) as Promise<Partial<InvestmentGraphStateType>>;
}

function buildInvestmentGraph() {
  const workflow = new StateGraph(InvestmentGraphState)
    .addNode("companyResearchNode", companyResearchNode)
    .addNode("financialAnalysisNode", financialAnalysisNode)
    .addNode("newsSentimentNode", newsSentimentNode)
    .addNode("competitiveAnalysisNode", competitiveAnalysisNode)
    .addNode("riskAnalysisNode", riskAnalysisNode)
    .addNode("investmentDecisionNode", investmentDecisionNode)
    .addEdge(START, "companyResearchNode")
    // Branch A: Financial -> Competitive
    .addEdge("companyResearchNode", "financialAnalysisNode")
    .addEdge("financialAnalysisNode", "competitiveAnalysisNode")
    .addEdge("competitiveAnalysisNode", "riskAnalysisNode")
    // Branch B: News Sentiment
    .addEdge("companyResearchNode", "newsSentimentNode")
    .addEdge("newsSentimentNode", "riskAnalysisNode")
    // Join at Risk -> Decision -> End
    .addEdge("riskAnalysisNode", "investmentDecisionNode")
    .addEdge("investmentDecisionNode", END);

  return workflow.compile();
}

let graphInstance: ReturnType<typeof buildInvestmentGraph> | null = null;

function getGraph() {
  if (!graphInstance) graphInstance = buildInvestmentGraph();
  return graphInstance;
}

export async function runInvestmentResearch(
  companyName: string,
  requestId: string
): Promise<InvestmentReport> {
  logger.info(`Starting investment research for: ${companyName} (requestId: ${requestId})`);

  // ── Mock mode: bypass all LLM calls (use on ZScaler-restricted networks) ──
  if (config.mockMode) {
    logger.warn(`[MOCK MODE] Returning mock report for: ${companyName}`);
    return buildMockReport(companyName, requestId);
  }

  const startTime = Date.now();
  const graph = getGraph();

  const initialState: Partial<InvestmentGraphStateType> = {
    companyName,
    requestId,
  };

  const finalState = await graph.invoke(initialState);

  const duration = Date.now() - startTime;
  logger.info(
    `Investment research completed for ${companyName} in ${(duration / 1000).toFixed(1)}s`
  );

  return buildReport(finalState as InvestmentGraphStateType, requestId);
}

function buildMockReport(companyName: string, requestId: string): InvestmentReport {
  const verdict: "INVEST" | "PASS" = Math.random() > 0.4 ? "INVEST" : "PASS";
  const ticker = companyName.toUpperCase().slice(0, 4);
  return {
    id: requestId,
    companyName,
    ticker,
    summary: `[MOCK] ${companyName}: ${verdict === "INVEST" ? "Strong fundamentals suggest a buying opportunity." : "Current valuation makes this a pass for now."}`,
    financialHealth:     { score: 75, explanation: "Solid financials with consistent growth." },
    sentiment:           { score: 70, explanation: "Overall positive market sentiment." },
    competitivePosition: { score: 78, explanation: "Strong competitive position." },
    riskLevel:           { score: 40, explanation: "Moderate overall risk." },
    companyOverview: { ticker, companyName, sector: "Technology", industry: "Software", description: `${companyName} is a leading company in its sector.`, businessModel: "B2B/B2C", revenueStreams: ["Products", "Services"], keyProducts: ["Core Platform"], leadership: [{ name: "CEO Name", title: "CEO" }], marketCap: 1_000_000_000, employees: 10000, founded: "2000", headquarters: "USA", website: `https://www.${companyName.toLowerCase()}.com`, exchange: "NASDAQ", score: 72, explanation: "Strong market position." },
    financialData: { revenueGrowthYoY: 12.5, revenueGrowthQoQ: 3.1, grossMargin: 68.0, operatingMargin: 22.0, netMargin: 18.5, roe: 24.0, debtToEquity: 0.4, currentRatio: 2.1, peRatio: 28, pbRatio: 5.2, evEbitda: 18, revenueHistory: [
      { period: "2024", revenue: 120000000000 },
      { period: "2023", revenue: 106000000000 },
      { period: "2022", revenue: 95000000000 },
      { period: "2021", revenue: 82000000000 }
    ], earningsHistory: [
      { period: "2024", earnings: 24000000000 },
      { period: "2023", earnings: 21000000000 },
      { period: "2022", earnings: 18000000000 },
      { period: "2021", earnings: 14000000000 }
    ], score: 75, explanation: "Solid financials." },
    newsData: { overallSentiment: "POSITIVE", positiveFactors: ["Strong earnings"], negativeFactors: ["Macro headwinds"], keyNews: [], analystRating: "Buy", score: 70, explanation: "Positive sentiment." },
    competitorData: { mainCompetitors: [], competitiveAdvantages: ["Brand", "Tech"], moat: "Switching costs", marketShareEstimate: "~15%", industryTrends: ["AI adoption"], positionVsCompetitors: "Leader", score: 78, explanation: "Strong position." },
    riskData: { overallRiskLevel: "MEDIUM", regulatoryRisks: ["Data privacy"], marketRisks: ["Interest rates"], industryRisks: ["Disruption"], companySpecificRisks: ["Key-person"], macroRisks: ["Recession"], score: 40, explanation: "Moderate risk." },
    finalDecision: verdict,
    confidence: Math.floor(60 + Math.random() * 35),
    reasoning: `Mock analysis for demo purposes on a ZScaler-restricted network.`,
    bullishFactors: ["Revenue growth", "Strong margins", "Market leadership"],
    bearishFactors: ["High valuation", "Macro uncertainty"],
    sources: [],
    agentTimeline: [],
    createdAt: new Date().toISOString(),
  } as unknown as InvestmentReport;
}

function buildReport(
  state: InvestmentGraphStateType,
  requestId: string
): InvestmentReport {
  const {
    companyName,
    companyResearch: cr,
    financialAnalysis: fa,
    newsSentiment: ns,
    competitiveAnalysis: ca,
    riskAnalysis: ra,
    investmentDecision: id,
    agentTimeline,
    sources,
  } = state;

  if (!cr || !fa || !ns || !ca || !ra || !id) {
    const missing = [
      !cr && "Company Research",
      !fa && "Financial Analysis",
      !ns && "News Sentiment",
      !ca && "Competitive Analysis",
      !ra && "Risk Analysis",
      !id && "Investment Decision",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Incomplete research - missing: ${missing}`);
  }

  const summary =
    id.summary ||
    `${companyName} is a ${cr.sector} company. ${id.decision === "INVEST" ? "Investment opportunity identified." : "Not recommended for investment at this time."}`;

  return {
    id: requestId,
    companyName: cr.companyName,
    ticker: cr.ticker,
    summary,
    financialHealth: {
      score: fa.score,
      explanation: fa.explanation,
    },
    sentiment: {
      score: ns.score,
      explanation: ns.explanation,
    },
    competitivePosition: {
      score: ca.score,
      explanation: ca.explanation,
    },
    riskLevel: {
      score: ra.score,
      explanation: ra.explanation,
    },
    companyOverview: cr,
    financialData: fa,
    newsData: ns,
    competitorData: ca,
    riskData: ra,
    finalDecision: id.decision,
    confidence: id.confidence,
    reasoning: id.reasoning,
    bullishFactors: id.keyBullishFactors,
    bearishFactors: id.keyBearishFactors,
    sources,
    agentTimeline,
    createdAt: new Date().toISOString(),
  };
}
