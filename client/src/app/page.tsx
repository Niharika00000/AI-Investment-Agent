"use client";

import { SearchForm } from "@/components/SearchForm";
import { ResearchHistory } from "@/components/ResearchHistory";
import { AppBackground } from "@/components/AppBackground";
import { AppNavbar } from "@/components/AppNavbar";
import { MarqueeTicker } from "@/components/MarqueeTicker";
import { SlideReveal } from "@/components/SlideReveal";
import {
  TrendingUp, Brain, Shield, BarChart3, Zap, Star, Loader2,
  Search, FileText, Target,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: <Brain className="w-5 h-5" />, title: "6 AI Agents", description: "Specialized agents for research, financials, news, competition, risk, and final decision." },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Live Financial Data", description: "Real-time data from Yahoo Finance, Alpha Vantage, and Finnhub APIs." },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Investment Decision", description: "Clear INVEST or PASS verdict with confidence score and detailed reasoning." },
  { icon: <Shield className="w-5 h-5" />, title: "Risk Analysis", description: "Multi-dimensional risk assessment covering regulatory, market, and company risks." },
  { icon: <Star className="w-5 h-5" />, title: "Competitive Intel", description: "Moat analysis, competitor benchmarking, and industry trend assessment." },
  { icon: <Zap className="w-5 h-5" />, title: "Explainable AI", description: "Transparent scoring with weighted dimensions and bull/bear case breakdowns." },
];

const METHODOLOGY = [
  {
    step: "01",
    icon: <Search className="w-5 h-5" />,
    title: "Enter a Company",
    description: "Type any public company name or ticker — our agents resolve the symbol automatically.",
  },
  {
    step: "02",
    icon: <FileText className="w-5 h-5" />,
    title: "Multi-Agent Analysis",
    description: "Six specialized agents audit financials, sentiment, competition, and risk in parallel pipelines.",
  },
  {
    step: "03",
    icon: <Target className="w-5 h-5" />,
    title: "Get Your Verdict",
    description: "Receive a defensible INVEST or PASS decision with confidence score and full reasoning.",
  },
];

const STATS = [
  { value: "6", label: "AI Agents" },
  { value: "4+", label: "Data Sources" },
  { value: "<2m", label: "Avg Audit" },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <AppBackground variant="home" />
      <AppNavbar />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Stats strip — SpendLens-style top metrics */}
        <SlideReveal className="page-container pt-6 pb-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <span className="glow-green-dot" />
              <span className="lens-tracked-label text-emerald-600 dark:text-emerald-400">Protocol · Intelligence</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="stat-pill">
                  <span className="stat-pill-value">{s.value}</span>
                  <span className="stat-pill-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SlideReveal>

        {/* Hero — horizontal slide-in */}
        <section className="page-container pt-10 pb-10 lg:pt-14 lg:pb-12">
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30, duration: 0.6 }}
            className="w-full space-y-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 28 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Autonomous Multi-Agent · Gemini AI</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] text-foreground">
              Your equity portfolio
              <br />
              is <span className="gradient-emerald-teal">leaking alpha.</span>
            </h1>

            <p className="text-body text-base md:text-lg lg:text-xl max-w-4xl mx-auto leading-relaxed font-medium">
              InvestInsight audits any public company in under 2 minutes — surfacing financial health,
              competitive moat, sentiment signals, and a defensible INVEST or PASS verdict.
            </p>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-2 w-full"
            >
              <SearchForm />
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-semibold text-subtle">
              {["Real pricing data", "Defensible reasoning", "Instant audit", "6-agent pipeline"].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card/60">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Full-bleed marquee */}
        <SlideReveal direction="right" delay={0.15}>
          <MarqueeTicker />
        </SlideReveal>

        {/* Methodology — 3 steps with horizontal slide */}
        <section className="page-container py-16 lg:py-20 section-lazy">
          <SlideReveal className="text-center mb-10">
            <span className="lens-tracked-label text-foreground/60">The Methodology</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mt-2 tracking-tight">
              Audit any company in 3 tactical steps
            </h2>
          </SlideReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {METHODOLOGY.map((m, i) => (
              <SlideReveal key={m.step} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.08}>
                <div className="method-card h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      {m.icon}
                    </div>
                    <span className="text-3xl font-black font-mono text-foreground/15">{m.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{m.title}</h3>
                  <p className="text-sm text-body leading-relaxed">{m.description}</p>
                </div>
              </SlideReveal>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="page-container pb-16 lg:pb-20 section-lazy">
          <SlideReveal className="text-center mb-10">
            <span className="lens-tracked-label text-foreground/60">The Intelligence</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mt-2 tracking-tight">
              Defensible numbers, plain-English reasoning
            </h2>
            <p className="text-body text-sm sm:text-base mt-3 max-w-2xl mx-auto">
              Every recommendation explains exactly why — so you can agree or push back with confidence.
            </p>
          </SlideReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {FEATURES.map((f, i) => (
              <SlideReveal key={f.title} direction={i % 2 === 0 ? "left" : "right"} delay={(i % 3) * 0.06}>
                <div className="glass-card-hover p-6 text-left space-y-3 relative overflow-hidden group cursor-default content-contain h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {f.icon}
                      </div>
                      <span className="text-3xl font-black font-mono text-foreground/12 group-hover:text-emerald-500/20 transition-colors select-none leading-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                    <p className="text-sm text-body leading-relaxed mt-1">{f.description}</p>
                  </div>
                </div>
              </SlideReveal>
            ))}
          </div>
        </section>

        {/* Research History */}
        <section id="history" className="page-container pb-16 lg:pb-20 section-lazy">
          <SlideReveal direction="left">
            <div className="glass-panel p-6 sm:p-8 content-contain">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="lens-tracked-label text-foreground/60">Research History</span>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1">Previous Reports</h3>
                </div>
                <div className="glow-green-dot animate-glow-pulse" />
              </div>
              <ResearchHistory />
            </div>
          </SlideReveal>
        </section>
      </div>
    </main>
  );
}
