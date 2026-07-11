"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, getSentimentColor } from "@/lib/utils";
import type { NewsSentimentOutput } from "@/types";
import { Badge } from "@/components/ui/badge";

interface NewsAnalysisProps {
  news: NewsSentimentOutput;
}

const SENTIMENT_CONFIG = {
  POSITIVE: {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/8 border-emerald-500/25",
    badge: "success" as const,
  },
  NEGATIVE: {
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    color: "text-red-500",
    bg: "bg-red-500/8 border-red-500/25",
    badge: "destructive" as const,
  },
  NEUTRAL: {
    icon: <Minus className="w-3.5 h-3.5" />,
    color: "text-amber-500",
    bg: "bg-amber-500/8 border-amber-500/25",
    badge: "warning" as const,
  },
};

export function NewsAnalysis({ news }: NewsAnalysisProps) {
  const config = SENTIMENT_CONFIG[news.overallSentiment];

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <div className={cn("rounded-xl border p-4 flex items-center gap-4", config.bg)}>
        <div className={cn("flex items-center gap-2", config.color)}>
          {config.icon}
          <span className="font-bold text-base">{news.overallSentiment}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{news.explanation}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cn("text-2xl font-black", config.color)}>{news.score}</div>
          <div className="text-[10px] text-muted-foreground">/100</div>
        </div>
      </div>

      {/* Analyst Rating */}
      {news.analystRating && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Analyst Consensus:</span>
          <Badge variant="default" className="text-xs">{news.analystRating}</Badge>
        </div>
      )}

      {/* Positive / Negative Factors */}
      <div className="grid md:grid-cols-2 gap-4">
        {news.positiveFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Positive Factors
            </h4>
            <ul className="space-y-1.5">
              {news.positiveFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {news.negativeFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Concerns
            </h4>
            <ul className="space-y-1.5">
              {news.negativeFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key News Articles */}
      {news.keyNews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key News Articles</h4>
          <div className="space-y-2">
            {news.keyNews.map((article, i) => {
              const articleConfig = SENTIMENT_CONFIG[article.sentiment];
              return (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/70 hover:border-border/80 transition-all duration-200 space-y-1.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </p>
                    <span className={cn("flex items-center gap-1 flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border", articleConfig.bg, articleConfig.color)}>
                      {articleConfig.icon}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
