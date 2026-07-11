// ─── API Response Types ────────────────────────────────────────────────────────

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
  score: number;
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
  score: number;
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
  score: number;
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
  score: number;
  explanation: string;
}

export interface RiskAnalysisOutput {
  overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  regulatoryRisks: string[];
  marketRisks: string[];
  industryRisks: string[];
  companySpecificRisks: string[];
  macroRisks: string[];
  score: number;
  explanation: string;
}

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

export interface ResearchHistoryItem {
  requestId: string;
  companyName: string;
  ticker: string | null;
  finalDecision: "INVEST" | "PASS" | null;
  confidence: number | null;
  financialScore: number | null;
  sentimentScore: number | null;
  riskScore: number | null;
  createdAt: string;
}

// ─── UI State Types ────────────────────────────────────────────────────────────

export type ResearchState = "idle" | "loading" | "success" | "error";

export interface ScoreCardData {
  label: string;
  score: number;
  explanation: string;
  color: string;
  icon: string;
}
