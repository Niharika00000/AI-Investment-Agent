import type { InvestmentReport, ResearchHistoryItem } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;

  // Dynamically extract the token from client localStorage
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// ─── Authentication API ────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string, name?: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function logoutApi(): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<{ user: User }> {
  return fetchApi<{ user: User }>("/auth/me");
}

// ─── Research API ──────────────────────────────────────────────────────────────

export interface ResearchResponse {
  id: string;
  report: InvestmentReport;
}

export async function startResearch(
  companyName: string
): Promise<ResearchResponse> {
  return fetchApi<ResearchResponse>("/research", {
    method: "POST",
    body: JSON.stringify({ companyName }),
  });
}

export async function getReport(id: string): Promise<ResearchResponse> {
  return fetchApi<ResearchResponse>(`/research/${id}`);
}

export async function getResearchHistory(): Promise<{
  reports: ResearchHistoryItem[];
}> {
  return fetchApi<{ reports: ResearchHistoryItem[] }>("/research/history");
}

export async function getAgentLogs(
  id: string
): Promise<{ logs: unknown[] }> {
  return fetchApi<{ logs: unknown[] }>(`/research/${id}/logs`);
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchApi<{ status: string }>("/health");
}
