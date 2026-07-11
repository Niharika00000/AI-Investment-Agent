"use client";

const ITEMS = [
  "Yahoo Finance",
  "Alpha Vantage",
  "Finnhub",
  "SEC EDGAR",
  "NewsAPI",
  "Gemini AI",
  "Apple",
  "Nvidia",
  "Microsoft",
  "Tesla",
  "Amazon",
  "LangGraph",
  "Multi-Agent",
  "INVEST / PASS",
];

export function MarqueeTicker() {
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="marquee-mask w-full border-y border-border/60 bg-card/40 backdrop-blur-sm py-3.5 overflow-hidden">
      <div className="marquee-track flex w-max gap-3">
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/80 bg-background/60 text-xs font-bold text-foreground/80 whitespace-nowrap shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
