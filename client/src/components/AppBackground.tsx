"use client";

import { useTheme } from "@/components/ThemeContext";

interface AppBackgroundProps {
  variant?: "home" | "research" | "auth";
}

export function AppBackground({ variant = "home" }: AppBackgroundProps) {
  const { isDark } = useTheme();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden app-background"
      aria-hidden="true"
    >
      {/* Base gradient mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(16,185,129,0.14) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(99,102,241,0.1) 0%, transparent 45%), radial-gradient(ellipse 70% 50% at 0% 80%, rgba(20,184,166,0.08) 0%, transparent 45%), hsl(var(--background))"
            : "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(16,185,129,0.18) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(99,102,241,0.1) 0%, transparent 45%), radial-gradient(ellipse 70% 50% at 0% 80%, rgba(20,184,166,0.1) 0%, transparent 45%), hsl(var(--background))",
        }}
      />

      {/* Animated beam sweep */}
      {variant === "home" && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-1/2 left-0 w-1/2 h-[200%] animate-beam-sweep opacity-30 ${
              isDark ? "bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent"
            }`}
          />
        </div>
      )}

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[
          { top: "12%", left: "8%", delay: "0s" },
          { top: "28%", left: "88%", delay: "1.2s" },
          { top: "55%", left: "15%", delay: "2.4s" },
          { top: "72%", left: "78%", delay: "0.8s" },
          { top: "40%", left: "45%", delay: "1.8s" },
          { top: "85%", left: "35%", delay: "3s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-500/60 animate-float"
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
      </div>

      {/* Pulsing rings — center accent */}
      {variant === "home" && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 rounded-full border border-emerald-500/10 animate-pulse-ring" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/15 animate-pulse-ring" style={{ animationDelay: "1s" }} />
        </div>
      )}

      {/* Orbs */}
      {variant === "home" && (
        <>
          <div className={`orb orb-1 w-[32rem] h-[32rem] sm:w-[48rem] sm:h-[48rem] -top-32 -left-20 ${isDark ? "bg-emerald-600/10" : "bg-emerald-400/16"}`} />
          <div className={`orb orb-2 w-[28rem] h-[28rem] sm:w-[40rem] sm:h-[40rem] top-1/3 -right-24 ${isDark ? "bg-indigo-600/8" : "bg-indigo-400/12"}`} />
          <div className={`orb orb-3 w-[24rem] h-[24rem] sm:w-[36rem] sm:h-[36rem] -bottom-20 left-1/4 ${isDark ? "bg-teal-600/7" : "bg-teal-400/10"}`} />
        </>
      )}

      {variant === "research" && (
        <>
          <div className={`orb orb-1 w-[30rem] h-[30rem] sm:w-[40rem] sm:h-[40rem] -top-24 -right-20 ${isDark ? "bg-emerald-600/8" : "bg-emerald-400/12"}`} />
          <div className={`orb orb-3 w-[24rem] h-[24rem] sm:w-[32rem] sm:h-[32rem] bottom-0 -left-12 ${isDark ? "bg-indigo-600/6" : "bg-indigo-400/10"}`} />
        </>
      )}

      {variant === "auth" && (
        <>
          <div className={`orb orb-1 w-[34rem] h-[34rem] -top-40 -left-20 ${isDark ? "bg-emerald-600/10" : "bg-emerald-400/16"}`} />
          <div className={`orb orb-2 w-[28rem] h-[28rem] -bottom-24 -right-20 ${isDark ? "bg-indigo-600/8" : "bg-indigo-400/12"}`} />
        </>
      )}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Subtle scan line */}
      {variant === "home" && (
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="h-24 w-full bg-gradient-to-b from-emerald-500/10 to-transparent animate-scan-line" />
        </div>
      )}

      {/* Corner brackets — tech aesthetic */}
      {variant === "home" && (
        <>
          <div className="corner-bracket corner-bracket-tl hidden lg:block" />
          <div className="corner-bracket corner-bracket-tr hidden lg:block" />
          <div className="corner-bracket corner-bracket-bl hidden lg:block" />
          <div className="corner-bracket corner-bracket-br hidden lg:block" />
        </>
      )}
    </div>
  );
}
