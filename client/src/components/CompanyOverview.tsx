"use client";

import { Building2, Globe, Users, Calendar, MapPin, TrendingUp } from "lucide-react";
import { formatMarketCap, formatNumber } from "@/lib/utils";
import type { CompanyResearchOutput } from "@/types";

interface CompanyOverviewProps {
  company: CompanyResearchOutput;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Company Meta */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetaItem icon={<Building2 className="w-3.5 h-3.5" />} label="Sector" value={company.sector} />
        <MetaItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="Industry" value={company.industry} />
        <MetaItem icon={<MapPin className="w-3.5 h-3.5" />} label="Headquarters" value={company.headquarters} />
        <MetaItem icon={<Users className="w-3.5 h-3.5" />} label="Employees" value={company.employees ? formatNumber(company.employees) : "N/A"} />
        <MetaItem icon={<Calendar className="w-3.5 h-3.5" />} label="Founded" value={company.founded || "N/A"} />
        <MetaItem icon={<Globe className="w-3.5 h-3.5" />} label="Market Cap" value={formatMarketCap(company.marketCap)} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
        <p className="text-sm text-foreground/80 leading-relaxed">{company.description}</p>
      </div>

      {/* Business Model */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Model</h4>
        <p className="text-sm text-foreground/80 leading-relaxed">{company.businessModel}</p>
      </div>

      {/* Revenue Streams */}
      {company.revenueStreams.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Streams</h4>
          <div className="flex flex-wrap gap-2">
            {company.revenueStreams.map((stream, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                {stream}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Products */}
      {company.keyProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Products & Services</h4>
          <div className="flex flex-wrap gap-2">
            {company.keyProducts.map((product, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300">
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Leadership */}
      {company.leadership.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leadership</h4>
          <div className="grid grid-cols-2 gap-2">
            {company.leadership.map((leader, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted border border-border">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 text-xs font-bold flex-shrink-0">
                  {leader.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{leader.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{leader.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-muted border border-border space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
