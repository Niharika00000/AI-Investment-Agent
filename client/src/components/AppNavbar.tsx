"use client";

import { useState } from "react";
import { TrendingUp, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { useTheme } from "@/components/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { name: "Capabilities", href: "#features" },
  { name: "History", href: "#history" },
];

const NAV_LINKS_RESEARCH = [
  { name: "Capabilities", href: "/#features" },
  { name: "History", href: "/#history" },
];

interface AppNavbarProps {
  layoutId?: string;
  links?: "home" | "research";
}

export function AppNavbar({ layoutId = "navPill", links = "home" }: AppNavbarProps) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const navLinks = links === "research" ? NAV_LINKS_RESEARCH : NAV_LINKS;

  return (
    <header
      className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 will-change-transform ${
        isDark
          ? "bg-background/90 border-border/60"
          : "bg-background/85 border-border/80"
      }`}
    >
      <div className="page-container flex items-center justify-between h-16">
        <a className="flex items-center gap-3 group flex-shrink-0" href="/">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black text-foreground tracking-tight">
              InvestInsight
            </span>
            <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
              AI Research
            </span>
          </div>
        </a>

        <nav
          className={`hidden lg:flex items-center gap-1 rounded-2xl p-1 border transition-colors duration-300 ${
            isDark ? "bg-muted/40 border-border/60" : "bg-muted/60 border-border"
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide transition-colors rounded-xl"
              onMouseEnter={() => setHoveredLink(link.name)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <AnimatePresence>
                {hoveredLink === link.name && (
                  <motion.span
                    layoutId={layoutId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      isDark ? "bg-accent" : "bg-background shadow-sm"
                    }`}
                  />
                )}
              </AnimatePresence>
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors duration-300 ${
                isDark ? "bg-muted/40 border-border/60" : "bg-muted/60 border-border"
              }`}
            >
              <div className="glow-green-dot animate-glow-pulse" />
              <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                {user.name || user.email}
              </span>
            </div>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="h-9 px-3 rounded-xl text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
