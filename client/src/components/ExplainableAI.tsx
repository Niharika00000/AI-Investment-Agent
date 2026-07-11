"use client";

import { Brain, TrendingUp, TrendingDown, Target } from "lucide-react";
import type { InvestmentReport } from "@/types";
import { cn } from "@/lib/utils";

interface ExplainableAIProps {
  report: InvestmentReport;
}

export function ExplainableAI({ report }: ExplainableAIProps) {
  const isInvest = report.finalDecision === "INVEST";

  // Weighted score calculation
  const weights = {
    financial: 0.3,
    company: 0.2,
    competitive: 0.2,
    sentiment: 0.15,
    risk: 0.15,
  };

  const scores = {
    financial: report.financialHealth.score,
    company: report.companyOverview.score,
    competitive: report.competitivePosition.score,
    sentiment: report.sentiment.score,
    risk: 100 - report.riskLevel.score,
  };

  const weightedScore =
    scores.financial * weights.financial +
    scores.company * weights.company +
    scores.competitive * weights.competitive +
    scores.sentiment * weights.sentiment +
    scores.risk * weights.risk;

  const dimensions = [
    {
      name: "Financial Health",
      score: scores.financial,
      weight: weights.financial,
      contribution: scores.financial * weights.financial,
      description: "Revenue growth, margins, cash flow, debt levels",
    },
    {
      name: "Company Quality",
      score: scores.company,
      weight: weights.company,
      contribution: scores.company * weights.company,
      description: "Business model, leadership, market position",
    },
    {
      name: "Competitive Position",
      score: scores.competitive,
      weight: weights.competitive,
      contribution: scores.competitive * weights.competitive,
      description: "Moat, market share, competitive advantages",
    },
    {
      name: "Market Sentiment",
      score: scores.sentiment,
      weight: weights.sentiment,
      contribution: scores.sentiment * weights.sentiment,
      description: "News coverage, analyst ratings, public sentiment",
    },
    {
      name: "Risk (Inverse)",
      score: scores.risk,
      weight: weights.risk,
      contribution: scores.risk * weights.risk,
      description: "Lower risk = higher contribution to score",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-indigo-400">
        <Brain className="w-4 h-4" />
        <h3 className="text-sm font-semibold">AI Decision Explainability</h3>
      </div>

      {/* Composite Score */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
            Weighted Composite Score
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-foreground">
              {weightedScore.toFixed(1)}
            </span>
            <span className="text-muted-foreground text-sm">/100</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${weightedScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Threshold: ≥60 → INVEST | &lt;60 → PASS
          <span
            className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
              isInvest
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {weightedScore >= 60 ? "ABOVE" : "BELOW"} THRESHOLD
          </span>
        </p>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Score Breakdown by Dimension
        </h4>
        {dimensions.map((dim) => (
          <DimensionRow key={dim.name} {...dim} totalScore={weightedScore} />
        ))}
      </div>

      {/* Bull vs Bear */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bull Case */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Bull Case
          </h4>
          <ul className="space-y-2">
            {report.bullishFactors.map((factor, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {/* Bear Case */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Bear Case
          </h4>
          <ul className="space-y-2">
            {report.bearishFactors.map((factor, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Confidence Explanation */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400">
            Confidence Calculation
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The {report.confidence}% confidence reflects the consistency of signals across
          all research dimensions. High-confidence decisions have strong alignment between
          financial health, market position, sentiment, and manageable risk levels.
        </p>
      </div>
    </div>
  );
}

function DimensionRow({
  name,
  score,
  weight,
  contribution,
}: {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  description: string;
  totalScore: number;
}) {
  const pct = Math.round(weight * 100);
  const color =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-yellow-500"
      : score >= 25
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground/80">{name}</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {pct}% weight
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{score}/100</span>
          <span className="text-indigo-400 font-medium min-w-[3rem] text-right">
            +{contribution.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
