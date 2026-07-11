"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History, TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { getResearchHistory } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { ResearchHistoryItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ResearchHistory() {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { reports } = await getResearchHistory();
      setHistory(reports);
    } catch {
      // History is optional
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <History className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground text-sm font-medium">No research history yet</p>
        <p className="text-foreground/55 text-xs">
          Your previous analyses will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Recent Analyses</span>
        </div>
        <button
          onClick={loadHistory}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <Link
            key={item.requestId}
            href={`/research/${item.requestId}`}
            className="block rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/60 hover:border-border/80 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Decision badge */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    item.finalDecision === "INVEST"
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  )}
                >
                  {item.finalDecision === "INVEST" ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.companyName}
                    </span>
                    {item.ticker && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 font-mono">
                        {item.ticker}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Confidence */}
              {item.confidence && (
                <div className="flex-shrink-0 text-right">
                  <div
                    className={cn(
                      "text-sm font-bold",
                      item.finalDecision === "INVEST"
                        ? "text-emerald-500"
                        : "text-red-500"
                    )}
                  >
                    {item.confidence}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">confidence</div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
