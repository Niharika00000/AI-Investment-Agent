import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMarketCap(value: number | null): string {
  if (!value) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function formatCurrency(value: number | null, inBillions = false): string {
  if (value === null || value === undefined) return "N/A";
  const v = inBillions ? value / 1e9 : value;
  return `$${v.toFixed(2)}B`;
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString();
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 50) return "bg-yellow-500/20 border-yellow-500/30";
  if (score >= 25) return "bg-orange-500/20 border-orange-500/30";
  return "bg-red-500/20 border-red-500/30";
}

export function getRiskColor(score: number): string {
  // For risk: lower is better
  if (score <= 25) return "text-emerald-400";
  if (score <= 50) return "text-yellow-400";
  if (score <= 75) return "text-orange-400";
  return "text-red-400";
}

export function getSentimentColor(sentiment: string): string {
  if (sentiment === "POSITIVE") return "text-emerald-400";
  if (sentiment === "NEGATIVE") return "text-red-400";
  return "text-yellow-400";
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
