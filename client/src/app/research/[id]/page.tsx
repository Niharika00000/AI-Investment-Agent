"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Building2,
  BarChart3,
  Newspaper,
  Swords,
  AlertTriangle,
  Brain,
  Clock,
  ExternalLink,
} from "lucide-react";
import { getReport } from "@/lib/api";
import type { InvestmentReport } from "@/types";
import { DecisionBanner } from "@/components/DecisionBanner";
import { ScoreCard } from "@/components/ScoreCard";
import { CompanyOverview } from "@/components/CompanyOverview";
import { motion } from "framer-motion";
import { AppBackground } from "@/components/AppBackground";
import { AppNavbar } from "@/components/AppNavbar";
import { SlideTabPanel } from "@/components/SlideTabPanel";
import { NewsAnalysis } from "@/components/NewsAnalysis";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { RiskMeter } from "@/components/RiskMeter";
import { AgentTimeline } from "@/components/AgentTimeline";
import { SourceCitations } from "@/components/SourceCitations";
import { ExplainableAI } from "@/components/ExplainableAI";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";

const RevenueChart = dynamic(
  () => import("@/components/FinancialChart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);
const EarningsChart = dynamic(
  () => import("@/components/FinancialChart").then((m) => m.EarningsChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> }
);
const MetricsRadar = dynamic(
  () => import("@/components/FinancialChart").then((m) => m.MetricsRadar),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full rounded-xl" /> }
);

const TAB_ORDER = ["overview", "financials", "news", "competition", "risks", "ai"] as const;

export default function ResearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [slideDirection, setSlideDirection] = useState(0);

  const handleTabChange = (value: string) => {
    const prevIdx = TAB_ORDER.indexOf(activeTab as (typeof TAB_ORDER)[number]);
    const nextIdx = TAB_ORDER.indexOf(value as (typeof TAB_ORDER)[number]);
    if (prevIdx !== -1 && nextIdx !== -1) {
      setSlideDirection(nextIdx > prevIdx ? 1 : -1);
    }
    setActiveTab(value);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    if (!id) return;

    const loadReport = async () => {
      setIsLoading(true);
      try {
        const { report: data } = await getReport(id);
        setReport(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load report"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (authLoading || isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">😕</div>
          <h2 className="text-xl font-semibold text-foreground">Report Not Found</h2>
          <p className="text-muted-foreground text-sm">{error || "Report not available"}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <AppBackground variant="research" />
      <AppNavbar layoutId="navPillDetail" links="research" />

      {/* Main Content Dashboard Container */}
      <div className="relative z-10 flex-1 py-6 lg:py-8 page-container space-y-6 lg:space-y-8">
        {/* Header Metadata & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-3xl content-contain">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-muted/50 hover:bg-muted border border-border transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-foreground leading-tight tracking-tight">{report.companyName}</h1>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                  {report.ticker}
                </Badge>
                {report.companyOverview?.exchange && (
                  <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                    {report.companyOverview.exchange}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Generated on {new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleShare} className="h-10 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest">
              <Share2 className="w-3.5 h-3.5 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-10 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest">
              <Download className="w-3.5 h-3.5 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="h-10 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              New Research
            </Button>
          </div>
        </div>

      {/* INVEST / PASS Decision Banner */}
      <DecisionBanner
        decision={report.finalDecision}
        confidence={report.confidence}
        companyName={report.companyName}
        ticker={report.ticker}
        reasoning={report.reasoning}
        priceTarget={report.companyOverview ? undefined : null}
        timeHorizon={undefined}
        riskRewardRatio={undefined}
      />

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard
          label="Financial Health"
          score={report.financialHealth.score}
          explanation={report.financialHealth.explanation}
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <ScoreCard
          label="Market Sentiment"
          score={report.sentiment.score}
          explanation={report.sentiment.explanation}
          icon={<Newspaper className="w-4 h-4" />}
        />
        <ScoreCard
          label="Competitive Position"
          score={report.competitivePosition.score}
          explanation={report.competitivePosition.explanation}
          icon={<Swords className="w-4 h-4" />}
        />
        <ScoreCard
          label="Risk Level"
          score={report.riskLevel.score}
          explanation={report.riskLevel.explanation}
          icon={<AlertTriangle className="w-4 h-4" />}
          invertScore={true}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap gap-0 p-1.5 w-full sm:w-auto">
          {[
            { value: "overview", label: "Overview", icon: <Building2 className="w-3.5 h-3.5 mr-1.5" /> },
            { value: "financials", label: "Financials", icon: <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> },
            { value: "news", label: "Sentiment", icon: <Newspaper className="w-3.5 h-3.5 mr-1.5" /> },
            { value: "competition", label: "Competition", icon: <Swords className="w-3.5 h-3.5 mr-1.5" /> },
            { value: "risks", label: "Risks", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> },
            { value: "ai", label: "AI Insights", icon: <Brain className="w-3.5 h-3.5 mr-1.5" /> },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="relative">
              {activeTab === tab.value && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <SlideTabPanel activeKey={activeTab} direction={slideDirection}>
          {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyOverview company={report.companyOverview} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* Quick Financial Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <FinancialMetric
                      label="Revenue Growth"
                      value={formatPercent(report.financialData.revenueGrowthYoY)}
                      positive={(report.financialData.revenueGrowthYoY ?? 0) > 0}
                    />
                    <FinancialMetric
                      label="Gross Margin"
                      value={formatPercent(report.financialData.grossMargin)}
                      positive={(report.financialData.grossMargin ?? 0) > 30}
                    />
                    <FinancialMetric
                      label="Net Margin"
                      value={formatPercent(report.financialData.netMargin)}
                      positive={(report.financialData.netMargin ?? 0) > 0}
                    />
                    <FinancialMetric
                      label="Free Cash Flow"
                      value={
                        report.financialData.freeCashFlow != null
                          ? formatCurrency(report.financialData.freeCashFlow)
                          : "N/A"
                      }
                      positive={(report.financialData.freeCashFlow ?? 0) > 0}
                    />
                    <FinancialMetric
                      label="P/E Ratio"
                      value={
                        report.financialData.peRatio != null
                          ? `${report.financialData.peRatio.toFixed(1)}x`
                          : "N/A"
                      }
                    />
                    <FinancialMetric
                      label="Debt/Equity"
                      value={
                        report.financialData.debtToEquity != null
                          ? `${report.financialData.debtToEquity.toFixed(2)}x`
                          : "N/A"
                      }
                      positive={(report.financialData.debtToEquity ?? 2) < 1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Margin Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Margin Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricsRadar data={report.financialData} />
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {activeTab === "financials" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue History</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={report.financialData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                <EarningsChart data={report.financialData} />
              </CardContent>
            </Card>

            {/* Valuation Metrics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Valuation & Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {[
                    { label: "P/E (TTM)", value: report.financialData.peRatio?.toFixed(1) ?? "N/A" },
                    { label: "Fwd P/E", value: "N/A" },
                    { label: "P/B", value: report.financialData.pbRatio?.toFixed(2) ?? "N/A" },
                    { label: "EV/EBITDA", value: report.financialData.evEbitda?.toFixed(1) ?? "N/A" },
                    { label: "ROE", value: formatPercent(report.financialData.roe) },
                    { label: "D/E Ratio", value: report.financialData.debtToEquity?.toFixed(2) ?? "N/A" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
                      <p className="text-sm font-bold text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Financial Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {report.financialHealth.explanation}
                </p>
              </CardContent>
            </Card>
          </div>
          )}

          {activeTab === "news" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Newspaper className="w-4 h-4 text-yellow-400" />
                News & Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewsAnalysis news={report.newsData} />
            </CardContent>
          </Card>
          )}

          {activeTab === "competition" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="w-4 h-4 text-blue-400" />
                Competitive Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitorAnalysis data={report.competitorData} />
            </CardContent>
          </Card>
          )}

          {activeTab === "risks" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskMeter risk={report.riskData} />
            </CardContent>
          </Card>
          )}

          {activeTab === "ai" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Explainable AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExplainableAI report={report} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agent Execution Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <AgentTimeline timeline={report.agentTimeline} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SourceCitations sources={report.sources} />
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </SlideTabPanel>
      </Tabs>
      </div>
    </main>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FinancialMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p
        className={
          positive === undefined
            ? "text-sm font-bold text-foreground"
            : positive
            ? "text-sm font-bold text-emerald-500"
            : "text-sm font-bold text-red-500"
        }
      >
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="page-container py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </main>
  );
}
