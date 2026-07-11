"use client";

import { cn } from "@/lib/utils";

interface DecisionBannerProps {
  decision: "INVEST" | "PASS";
  confidence: number;
  companyName: string;
  ticker: string;
  reasoning: string;
  priceTarget?: string | null;
  timeHorizon?: string;
  riskRewardRatio?: string;
}

export function DecisionBanner({
  decision, confidence, companyName, ticker, reasoning,
  priceTarget, timeHorizon, riskRewardRatio,
}: DecisionBannerProps) {
  const isInvest = decision === "INVEST";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-8 transition-all duration-500",
        isInvest
          ? "border-emerald-500/25 bg-emerald-500/5 invest-glow"
          : "border-red-500/25 bg-red-500/5 pass-glow"
      )}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isInvest
            ? "radial-gradient(ellipse at top right, rgba(16,185,129,0.12) 0%, transparent 60%)"
            : "radial-gradient(ellipse at top right, rgba(239,68,68,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 space-y-6">
        {/* Main Decision */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{isInvest ? "✅" : "❌"}</span>
              <div>
                <h2 className={cn("text-3xl font-black tracking-wide", isInvest ? "text-emerald-500" : "text-red-500")}>
                  {decision}
                </h2>
                <p className="text-muted-foreground text-sm">{companyName} ({ticker})</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <ConfidenceRing confidence={confidence} isInvest={isInvest} />
          </div>
        </div>

        {/* Reasoning */}
        <div className={cn("rounded-xl p-4 border", isInvest ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
          <p className="text-sm text-foreground/80 leading-relaxed">{reasoning}</p>
        </div>

        {/* Meta info */}
        {(priceTarget || timeHorizon || riskRewardRatio) && (
          <div className="grid grid-cols-3 gap-4">
            {priceTarget && <MetaItem label="Price Target" value={priceTarget} isInvest={isInvest} />}
            {timeHorizon && <MetaItem label="Time Horizon" value={timeHorizon} isInvest={isInvest} />}
            {riskRewardRatio && <MetaItem label="Risk/Reward" value={riskRewardRatio} isInvest={isInvest} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceRing({ confidence, isInvest }: { confidence: number; isInvest: boolean }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - confidence / 100);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90 absolute" viewBox="0 0 112 112" fill="none">
        <circle cx="56" cy="56" r={radius} stroke="currentColor" strokeOpacity="0.1" strokeWidth="6" className="text-foreground" />
        <circle
          cx="56" cy="56" r={radius}
          stroke={isInvest ? "#10b981" : "#ef4444"}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${strokeDashoffset}`}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-1">
        <span className={cn("text-2xl font-black leading-none", isInvest ? "text-emerald-500" : "text-red-500")}>
          {confidence}%
        </span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1 font-semibold leading-none">
          confidence
        </span>
      </div>
    </div>
  );
}

function MetaItem({ label, value, isInvest }: { label: string; value: string; isInvest: boolean }) {
  return (
    <div className={cn("rounded-2xl p-3 border text-center bg-card", isInvest ? "border-emerald-500/15" : "border-red-500/15")}>
      <p className="lens-tracked-label mb-1">{label}</p>
      <p className="text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}
