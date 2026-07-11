-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "research_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "research_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ticker" TEXT,
    "summary" TEXT,
    "financialScore" INTEGER,
    "financialExplanation" TEXT,
    "sentimentScore" INTEGER,
    "sentimentExplanation" TEXT,
    "competitiveScore" INTEGER,
    "competitiveExplanation" TEXT,
    "riskScore" INTEGER,
    "riskExplanation" TEXT,
    "finalDecision" TEXT,
    "confidence" INTEGER,
    "reasoning" TEXT,
    "fullReport" TEXT,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "agentTimeline" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "research_reports_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "research_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "research_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "research_requests_companyName_idx" ON "research_requests"("companyName");

-- CreateIndex
CREATE INDEX "research_requests_status_idx" ON "research_requests"("status");

-- CreateIndex
CREATE INDEX "research_requests_createdAt_idx" ON "research_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "research_reports_requestId_key" ON "research_reports"("requestId");

-- CreateIndex
CREATE INDEX "research_reports_companyName_idx" ON "research_reports"("companyName");

-- CreateIndex
CREATE INDEX "research_reports_ticker_idx" ON "research_reports"("ticker");

-- CreateIndex
CREATE INDEX "research_reports_finalDecision_idx" ON "research_reports"("finalDecision");

-- CreateIndex
CREATE INDEX "agent_logs_requestId_idx" ON "agent_logs"("requestId");

-- CreateIndex
CREATE INDEX "agent_logs_agentName_idx" ON "agent_logs"("agentName");
