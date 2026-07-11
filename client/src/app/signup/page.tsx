"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { AppBackground } from "@/components/AppBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Lock, Mail, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signup(email.trim(), password, name.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300 overflow-hidden">
      <AppBackground variant="auth" />

      <div className="relative z-10 flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25 mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Create your <span className="gradient-emerald-teal">account</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Register to build your investment research workspace
            </p>
          </div>

          <Card className="overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
            <CardHeader className="space-y-1.5 pb-5 pt-7 px-7">
              <CardTitle className="text-lg font-bold text-foreground text-center">Sign Up</CardTitle>
              <CardDescription className="text-center text-sm">
                Create an account to track metrics, decide, and save reports
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 pb-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive font-semibold text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label htmlFor="name" className="lens-tracked-label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 rounded-xl h-11 text-sm"
                      disabled={isLoading}
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="lens-tracked-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-11 text-sm"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="lens-tracked-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="•••••••• (6+ characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl h-11 text-sm"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all mt-2 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating account…
                    </>
                  ) : "Sign Up"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
