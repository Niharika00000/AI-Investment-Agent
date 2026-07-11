"use client";

import { AlertTriangle, Shield, TrendingDown, Globe, Building2 } from "lucide-react";
import type { RiskAnalysisOutput } from "@/types";
import { cn } from "@/lib/utils";

interface RiskMeterProps {
  risk: RiskAnalysisOutput;
}

const RISK_CONFIG = {
  LOW: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", level: 1 },
  MEDIUM: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", level: 2 },
  HIGH: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", level: 3 },
  VERY_HIGH: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", level: 4 },
};

export function RiskMeter({ risk }: RiskMeterProps) {
  const config = RISK_CONFIG[risk.overallRiskLevel];

  return (
    <div className="space-y-6">
      {/* Risk Level Indicator */}
      <div
        className={cn(
          "rounded-xl border p-5 flex items-center gap-4",
          config.bg,
          config.border
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            config.bg,
            "border",
            config.border
          )}
        >
          <AlertTriangle className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn("text-lg font-bold", config.color)}>
              {risk.overallRiskLevel.replace("_", " ")} RISK
            </h3>
            <span className="text-muted-foreground text-sm">— Score: {risk.score}/100</span>
          </div>
          <p className="text-xs text-muted-foreground">{risk.explanation}</p>
        </div>
        {/* Risk meter bars */}
        <div className="flex gap-1 flex-shrink-0">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "w-2 h-8 rounded-full transition-all duration-500",
                level <= config.level
                  ? config.level === 1
                    ? "bg-emerald-500"
                    : config.level === 2
                    ? "bg-yellow-500"
                    : config.level === 3
                    ? "bg-orange-500"
                    : "bg-red-500"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Risk Categories */}
      <div className="grid gap-4">
        <RiskCategory
          icon={<Building2 className="w-4 h-4" />}
          title="Regulatory & Legal"
          risks={risk.regulatoryRisks}
          color="text-purple-400"
        />
        <RiskCategory
          icon={<TrendingDown className="w-4 h-4" />}
          title="Market Risks"
          risks={risk.marketRisks}
          color="text-orange-400"
        />
        <RiskCategory
          icon={<Globe className="w-4 h-4" />}
          title="Industry Risks"
          risks={risk.industryRisks}
          color="text-blue-400"
        />
        <RiskCategory
          icon={<AlertTriangle className="w-4 h-4" />}
          title="Company-Specific"
          risks={risk.companySpecificRisks}
          color="text-red-400"
        />
        <RiskCategory
          icon={<Shield className="w-4 h-4" />}
          title="Macro & Geopolitical"
          risks={risk.macroRisks}
          color="text-yellow-400"
        />
      </div>
    </div>
  );
}

function RiskCategory({
  icon,
  title,
  risks,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  risks: string[];
  color: string;
}) {
  if (!risks || risks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-sm font-medium", color)}>
        {icon}
        <span>{title}</span>
        <span className="text-muted-foreground text-xs font-normal ml-1">
          ({risks.length})
        </span>
      </div>
      <ul className="space-y-1.5">
        {risks.map((risk, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
          >
            <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
            {risk}
          </li>
        ))}
      </ul>
    </div>
  );
}
