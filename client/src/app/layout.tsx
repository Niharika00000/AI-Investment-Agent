import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/ThemeContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InvestInsight — AI Investment Research",
  description:
    "AI-powered investment research platform that analyses companies using multi-agent LangGraph workflows and delivers structured INVEST/PASS decisions.",
  keywords: ["investment", "AI", "research", "stocks", "financial analysis"],
  authors: [{ name: "InvestInsight" }],
  openGraph: {
    title: "InvestInsight — AI Investment Research",
    description: "Make smarter investment decisions with AI-powered multi-agent analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // No hardcoded "dark" here — ThemeProvider sets it dynamically on <html>
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash: inline script reads preference before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('ii-theme');
                if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.add(t);
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
