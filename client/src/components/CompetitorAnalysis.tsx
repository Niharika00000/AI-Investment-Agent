"use client";

import { Shield, Swords, TrendingUp } from "lucide-react";
import type { CompetitiveAnalysisOutput } from "@/types";
import { cn } from "@/lib/utils";

interface CompetitorAnalysisProps {
  data: CompetitiveAnalysisOutput;
}

export function CompetitorAnalysis({ data }: CompetitorAnalysisProps) {
  const moatColor =
    data.moat.toLowerCase().includes("wide")
      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/8"
      : data.moat.toLowerCase().includes("narrow")
      ? "text-amber-500 border-amber-500/30 bg-amber-500/8"
      : "text-muted-foreground border-border bg-muted/40";

  return (
    <div className="space-y-6">
      {/* Market Position */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Market Share</p>
          <p className="text-sm font-semibold text-foreground">{data.marketShareEstimate}</p>
        </div>
        <div className={cn("rounded-xl border p-4 space-y-1", moatColor)}>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Economic Moat</p>
          <p className="text-sm font-bold">{data.moat}</p>
        </div>
      </div>

      {/* Position summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-foreground/80 leading-relaxed">{data.positionVsCompetitors}</p>
      </div>

      {/* Competitive Advantages */}
      {data.competitiveAdvantages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Competitive Advantages
          </h4>
          <div className="space-y-1.5">
            {data.competitiveAdvantages.map((advantage, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {advantage}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {data.mainCompetitors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            Main Competitors
          </h4>
          <div className="space-y-3">
            {data.mainCompetitors.map((competitor, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{competitor.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({competitor.ticker})</span>
                  </div>
                  {competitor.marketCapComparison && (
                    <span className="text-[10px] text-muted-foreground px-2 py-1 rounded bg-muted border border-border flex-shrink-0">
                      {competitor.marketCapComparison}
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {competitor.strengths.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-500 mb-1.5 uppercase tracking-wider">Strengths</p>
                      <ul className="space-y-1">
                        {competitor.strengths.map((s, j) => (
                          <li key={j} className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {competitor.weaknesses.length > 0 && (
                    <div>
                      <p className="text-[10px] text-red-500 mb-1.5 uppercase tracking-wider">Weaknesses</p>
                      <ul className="space-y-1">
                        {competitor.weaknesses.map((w, j) => (
                          <li key={j} className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Trends */}
      {data.industryTrends.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Industry Trends
          </h4>
          <div className="space-y-1.5">
            {data.industryTrends.map((trend, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {trend}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
