"use client";

import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { AgentTimelineEntry } from "@/types";

interface AgentTimelineProps {
  timeline: AgentTimelineEntry[];
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  "Company Research Agent": <span>🏢</span>,
  "Financial Analysis Agent": <span>📊</span>,
  "News & Sentiment Agent": <span>📰</span>,
  "Competitive Analysis Agent": <span>⚔️</span>,
  "Risk Analysis Agent": <span>⚠️</span>,
  "Investment Decision Agent": <span>🎯</span>,
};

export function AgentTimeline({ timeline }: AgentTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No agent timeline data available
      </div>
    );
  }

  const totalDuration = timeline.reduce((acc, e) => acc + e.durationMs, 0);

  return (
    <div className="space-y-4">
      {/* Total duration */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-indigo-500" />
          <span>Total execution: {formatDuration(totalDuration)}</span>
        </div>
        <span>{timeline.length} agents executed</span>
      </div>

      {/* Timeline items */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

        {timeline.map((entry, index) => (
          <TimelineItem
            key={entry.agentName}
            entry={entry}
            isLast={index === timeline.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ entry, isLast }: { entry: AgentTimelineEntry; isLast: boolean }) {
  const isSuccess = entry.status === "SUCCESS";
  const isFailed = entry.status === "FAILED";

  return (
    <div className={`relative flex gap-4 pb-4 ${isLast ? "pb-0" : ""}`}>
      {/* Status icon */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border ${
            isSuccess
              ? "bg-emerald-500/10 border-emerald-500/30"
              : isFailed
              ? "bg-red-500/10 border-red-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          {AGENT_ICONS[entry.agentName] || <span>🤖</span>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1.5 pb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{entry.agentName}</h4>
            {isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : isFailed ? (
              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDuration(entry.durationMs)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{entry.summary}</p>

        {/* Duration bar */}
        <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isSuccess ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min((entry.durationMs / 30000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
