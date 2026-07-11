// ─── Agent Output Types ────────────────────────────────────────────────────────

export interface CompanyResearchOutput {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  businessModel: string;
  revenueStreams: string[];
  keyProducts: string[];
  leadership: Array<{ name: string; title: string }>;
  marketCap: number | null;
  employees: number | null;
  founded: string | null;
  headquarters: string;
  website: string;
  exchange: string;
  score: number; // 0-100 overall company quality
  explanation: string;
}

export interface FinancialAnalysisOutput {
  revenueGrowthYoY: number | null;
  revenueGrowthQoQ: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  freeCashFlow: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  evEbitda: number | null;
  revenueHistory: Array<{ period: string; revenue: number }>;
  earningsHistory: Array<{ period: string; earnings: number }>;
  score: number; // 0-100 financial health score
  explanation: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsSentimentOutput {
  overallSentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  positiveFactors: string[];
  negativeFactors: string[];
  keyNews: NewsItem[];
  analystRating: string;
  score: number; // 0-100 sentiment score
  explanation: string;
}

export interface Competitor {
  name: string;
  ticker: string;
  strengths: string[];
  weaknesses: string[];
  marketCapComparison: string;
}

export interface CompetitiveAnalysisOutput {
  mainCompetitors: Competitor[];
  competitiveAdvantages: string[];
  moat: string;
  marketShareEstimate: string;
  industryTrends: string[];
  positionVsCompetitors: string;
  score: number; // 0-100 competitive strength score
  explanation: string;
}

export interface RiskAnalysisOutput {
  overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  regulatoryRisks: string[];
  marketRisks: string[];
  industryRisks: string[];
  companySpecificRisks: string[];
  macroRisks: string[];
  score: number; // 0-100 where lower = less risky
  explanation: string;
}

export interface InvestmentDecisionOutput {
  decision: "INVEST" | "PASS";
  confidence: number; // 0-100
  reasoning: string;
  keyBullishFactors: string[];
  keyBearishFactors: string[];
  priceTarget: string | null;
  timeHorizon: string;
  riskRewardRatio: string;
  summary: string;
}

// ─── Graph State ───────────────────────────────────────────────────────────────

export interface AgentTimelineEntry {
  agentName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  summary: string;
}

export interface SourceEntry {
  name: string;
  url: string;
  type: "FINANCIAL" | "NEWS" | "RESEARCH" | "REGULATORY" | "OTHER";
}

export interface GraphState {
  companyName: string;
  requestId: string;
  companyResearch: CompanyResearchOutput | null;
  financialAnalysis: FinancialAnalysisOutput | null;
  newsSentiment: NewsSentimentOutput | null;
  competitiveAnalysis: CompetitiveAnalysisOutput | null;
  riskAnalysis: RiskAnalysisOutput | null;
  investmentDecision: InvestmentDecisionOutput | null;
  agentTimeline: AgentTimelineEntry[];
  sources: SourceEntry[];
  errors: string[];
}

// ─── API Request / Response Types ─────────────────────────────────────────────

export interface ResearchRequest {
  companyName: string;
}

export interface InvestmentReport {
  id: string;
  companyName: string;
  ticker: string;
  summary: string;
  financialHealth: {
    score: number;
    explanation: string;
  };
  sentiment: {
    score: number;
    explanation: string;
  };
  competitivePosition: {
    score: number;
    explanation: string;
  };
  riskLevel: {
    score: number;
    explanation: string;
  };
  companyOverview: CompanyResearchOutput;
  financialData: FinancialAnalysisOutput;
  newsData: NewsSentimentOutput;
  competitorData: CompetitiveAnalysisOutput;
  riskData: RiskAnalysisOutput;
  finalDecision: "INVEST" | "PASS";
  confidence: number;
  reasoning: string;
  bullishFactors: string[];
  bearishFactors: string[];
  sources: SourceEntry[];
  agentTimeline: AgentTimelineEntry[];
  createdAt: string;
}

// ─── Service Layer Types ───────────────────────────────────────────────────────

export interface YahooQuoteSummary {
  assetProfile?: {
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    website?: string;
    industry?: string;
    industryKey?: string;
    industrialKey?: string;
    sector?: string;
    sectorKey?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
    companyOfficers?: Array<{
      name?: string;
      title?: string;
      totalPay?: { raw?: number; fmt?: string };
    }>;
    auditRisk?: number;
    boardRisk?: number;
    compensationRisk?: number;
    shareHolderRightsRisk?: number;
    overallRisk?: number;
    governanceEpochDate?: number;
    compensationAsOfEpochDate?: number;
    maxAge?: number;
  };
  financialData?: {
    currentPrice?: { raw?: number; fmt?: string };
    targetHighPrice?: { raw?: number; fmt?: string };
    targetLowPrice?: { raw?: number; fmt?: string };
    targetMeanPrice?: { raw?: number; fmt?: string };
    targetMedianPrice?: { raw?: number; fmt?: string };
    recommendationMean?: { raw?: number; fmt?: string };
    recommendationKey?: string;
    numberOfAnalystOpinions?: { raw?: number; fmt?: string };
    totalCash?: { raw?: number; fmt?: string };
    totalCashPerShare?: { raw?: number; fmt?: string };
    ebitda?: { raw?: number; fmt?: string };
    totalDebt?: { raw?: number; fmt?: string };
    quickRatio?: { raw?: number; fmt?: string };
    currentRatio?: { raw?: number; fmt?: string };
    totalRevenue?: { raw?: number; fmt?: string };
    debtToEquity?: { raw?: number; fmt?: string };
    revenuePerShare?: { raw?: number; fmt?: string };
    returnOnAssets?: { raw?: number; fmt?: string };
    returnOnEquity?: { raw?: number; fmt?: string };
    grossProfits?: { raw?: number; fmt?: string };
    freeCashflow?: { raw?: number; fmt?: string };
    operatingCashflow?: { raw?: number; fmt?: string };
    earningsGrowth?: { raw?: number; fmt?: string };
    revenueGrowth?: { raw?: number; fmt?: string };
    grossMargins?: { raw?: number; fmt?: string };
    ebitdaMargins?: { raw?: number; fmt?: string };
    operatingMargins?: { raw?: number; fmt?: string };
    profitMargins?: { raw?: number; fmt?: string };
  };
  defaultKeyStatistics?: {
    enterpriseValue?: { raw?: number; fmt?: string };
    forwardPE?: { raw?: number; fmt?: string };
    profitMargins?: { raw?: number; fmt?: string };
    floatShares?: { raw?: number; fmt?: string };
    sharesOutstanding?: { raw?: number; fmt?: string };
    heldPercentInsiders?: { raw?: number; fmt?: string };
    heldPercentInstitutions?: { raw?: number; fmt?: string };
    shortRatio?: { raw?: number; fmt?: string };
    bookValue?: { raw?: number; fmt?: string };
    priceToBook?: { raw?: number; fmt?: string };
    earningsQuarterlyGrowth?: { raw?: number; fmt?: string };
    netIncomeToCommon?: { raw?: number; fmt?: string };
    trailingEps?: { raw?: number; fmt?: string };
    forwardEps?: { raw?: number; fmt?: string };
    pegRatio?: { raw?: number; fmt?: string };
    enterpriseToRevenue?: { raw?: number; fmt?: string };
    enterpriseToEbitda?: { raw?: number; fmt?: string };
    beta?: { raw?: number; fmt?: string };
    "52WeekChange"?: { raw?: number; fmt?: string };
  };
  summaryDetail?: {
    previousClose?: { raw?: number; fmt?: string };
    open?: { raw?: number; fmt?: string };
    dayLow?: { raw?: number; fmt?: string };
    dayHigh?: { raw?: number; fmt?: string };
    dividendRate?: { raw?: number; fmt?: string };
    dividendYield?: { raw?: number; fmt?: string };
    exDividendDate?: { raw?: number; fmt?: string };
    payoutRatio?: { raw?: number; fmt?: string };
    beta?: { raw?: number; fmt?: string };
    trailingPE?: { raw?: number; fmt?: string };
    forwardPE?: { raw?: number; fmt?: string };
    volume?: { raw?: number; fmt?: string };
    marketCap?: { raw?: number; fmt?: string };
    fiftyTwoWeekLow?: { raw?: number; fmt?: string };
    fiftyTwoWeekHigh?: { raw?: number; fmt?: string };
    priceToSalesTrailing12Months?: { raw?: number; fmt?: string };
    fiftyDayAverage?: { raw?: number; fmt?: string };
    twoHundredDayAverage?: { raw?: number; fmt?: string };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomeStatementHistory?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balanceSheetHistory?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cashflowStatementHistory?: any;
}

export interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface FinnhubNewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// ─── Database Model Types ──────────────────────────────────────────────────────

export type RequestStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface DbResearchRequest {
  id: string;
  companyName: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbResearchReport {
  id: string;
  requestId: string;
  companyName: string;
  ticker: string | null;
  report: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbAgentLog {
  id: string;
  requestId: string;
  agentName: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  startTime: Date;
  endTime: Date | null;
  status: string;
  error: string | null;
}
