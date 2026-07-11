"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startResearch } from "@/lib/api";

const EXAMPLE_COMPANIES = ["Apple", "Nvidia", "Microsoft", "Tesla", "Amazon"];

export function SearchForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await startResearch(company.trim());
      router.push(`/research/${response.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Research failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleExample = (name: string) => {
    setCompany(name);
  };

  return (
    <div className="w-full mx-auto space-y-5">
      <div className="glass-panel p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name (e.g., Apple, Nvidia, Tesla)"
                className="pl-12 h-14 text-sm sm:text-base rounded-2xl border-border bg-background text-foreground placeholder:text-foreground/45 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !company.trim()}
              className="h-14 px-8 sm:px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/25 transition-all flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Research</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div className="text-center space-y-4 py-5 glass-panel">
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">
              Running Multi-Agent Analysis · 30-60s
            </span>
          </div>
          <div className="flex justify-center gap-2 flex-wrap px-4">
            {[
              "Company Profile",
              "Financial Statements",
              "Sentiment Scan",
              "Competitor Peers",
              "Risk Evaluation",
              "Final Decision",
            ].map((agent, i) => (
              <div key={agent} className="flex flex-col items-center gap-1.5">
                <div className="h-1.5 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                    style={{
                      width: "100%",
                      animation: `pulse ${1.2 + i * 0.2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest text-foreground/55 select-none">
                  {agent.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-body font-medium px-4">
            Fetching SEC statements, resolving sentiment cycles, and building risk matrices…
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive text-center">
          {error}
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/55">Try:</span>
          {EXAMPLE_COMPANIES.map((name) => (
            <button
              key={name}
              onClick={() => handleExample(name)}
              className="text-[10px] font-bold px-4 py-1.5 rounded-xl bg-card border border-border text-foreground/75 hover:text-foreground hover:bg-accent hover:border-emerald-500/30 transition-all duration-200"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
