"use client";

import { cn, getScoreColor, getScoreBg } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  score: number;
  explanation: string;
  icon: React.ReactNode;
  invertScore?: boolean; // For risk: lower is better
  className?: string;
}

export function ScoreCard({
  label,
  score,
  explanation,
  icon,
  invertScore = false,
  className,
}: ScoreCardProps) {
  const displayScore = invertScore ? 100 - score : score;
  const colorScore = invertScore ? 100 - score : score;

  const getLabel = () => {
    if (colorScore >= 75) return "Excellent";
    if (colorScore >= 60) return "Good";
    if (colorScore >= 45) return "Average";
    if (colorScore >= 30) return "Poor";
    return "Critical";
  };

  return (
    <div
      className={cn(
        "glass-card-hover p-4 sm:p-5 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-muted text-muted-foreground flex-shrink-0">{icon}</div>
          <span
            className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/55 select-none truncate"
            title={label}
          >{label}</span>
        </div>
        <span
          className={cn(
            "text-[8px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-full border border-border flex-shrink-0 whitespace-nowrap",
            getScoreBg(colorScore)
          )}
        >
          {getLabel()}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg
            className="w-14 h-14 -rotate-90"
            viewBox="0 0 64 64"
            fill="none"
          >
            {/* Background ring */}
            <circle cx="32" cy="32" r="26" stroke="currentColor" strokeOpacity="0.1" strokeWidth="5" className="text-foreground" />
            {/* Score ring */}
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke={
                colorScore >= 75
                  ? "#10b981"
                  : colorScore >= 50
                  ? "#eab308"
                  : colorScore >= 25
                  ? "#f97316"
                  : "#ef4444"
              }
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - displayScore / 100)}`}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "text-sm font-bold",
                getScoreColor(colorScore)
              )}
            >
              {score}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 font-medium">
          {explanation}
        </p>
      </div>

      {/* Bar */}
      <div className="space-y-1">
        <div className="w-full h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${displayScore}%`,
              background:
                colorScore >= 75
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : colorScore >= 50
                  ? "linear-gradient(90deg, #d97706, #eab308)"
                  : colorScore >= 25
                  ? "linear-gradient(90deg, #ea580c, #f97316)"
                  : "linear-gradient(90deg, #dc2626, #ef4444)",
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-semibold text-muted-foreground tracking-wider">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
