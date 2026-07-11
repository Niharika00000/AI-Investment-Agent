"use client";

import { ExternalLink, Globe, Newspaper, FileText, BookOpen } from "lucide-react";
import type { SourceEntry } from "@/types";

interface SourceCitationsProps {
  sources: SourceEntry[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  FINANCIAL: <Globe className="w-3.5 h-3.5 text-blue-400" />,
  NEWS: <Newspaper className="w-3.5 h-3.5 text-yellow-400" />,
  RESEARCH: <FileText className="w-3.5 h-3.5 text-purple-400" />,
  REGULATORY: <BookOpen className="w-3.5 h-3.5 text-red-400" />,
  OTHER: <Globe className="w-3.5 h-3.5 text-slate-400" />,
};

const TYPE_LABELS: Record<string, string> = {
  FINANCIAL: "Financial",
  NEWS: "News",
  RESEARCH: "Research",
  REGULATORY: "Regulatory",
  OTHER: "Other",
};

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No sources recorded
      </div>
    );
  }

  // Group by type
  const grouped = sources.reduce(
    (acc, source) => {
      const type = source.type || "OTHER";
      if (!acc[type]) acc[type] = [];
      acc[type].push(source);
      return acc;
    },
    {} as Record<string, SourceEntry[]>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        This analysis was generated using data from {sources.length} source
        {sources.length !== 1 ? "s" : ""}
      </p>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="space-y-2">
          <div className="flex items-center gap-2">
            {TYPE_ICONS[type]}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {TYPE_LABELS[type]} ({items.length})
            </span>
          </div>
          <div className="grid gap-2">
            {items.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/70 hover:border-border/80 transition-colors duration-200 group"
              >
                <span className="text-xs text-foreground/80 truncate group-hover:text-foreground transition-colors">
                  {source.name}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
