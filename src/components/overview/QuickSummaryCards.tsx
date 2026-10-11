/**
 * RunwayOS — Quick Summary Cards & Contextual Financial Indicators
 * 4 Primary Actionable Fintech Cards:
 * 1. Available to Spend (Interactive breakdown trigger)
 * 2. Upcoming Commitments (Next bill indicator)
 * 3. Projected Month-End Cash (Scenario delta comparison)
 * 4. Financial Resilience (Deterministic status: Resilient / Needs Attention / At Risk)
 *
 * Plus At-a-Glance Strip: Total Committed Outflow, Pending Income Amount, Burn Rate Trend.
 * Plus Secondary Contextual Indicators: Lowest Balance, Risk Date, Stress Pass %, Goal Progress.
 */

import React from 'react';
import { CashMetrics, Commitment, DecisionOption, SavingsGoal } from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import {
  Wallet,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  DollarSign,
  Flame,
  Target,
  Activity,
  Layers,
} from 'lucide-react';

interface QuickSummaryCardsProps {
  metrics: CashMetrics;
  nextCommitment?: Commitment | null;
  primaryGoal?: SavingsGoal | null;
  previewOption?: DecisionOption | null;
  simulationDay: number;
  onOpenAvailableBreakdown: () => void;
  onNavigateCommitments: () => void;
  onNavigateCashflow: () => void;
  onNavigateRecovery: () => void;
}

export const QuickSummaryCards: React.FC<QuickSummaryCardsProps> = ({
  metrics,
  nextCommitment,
  primaryGoal,
  previewOption,
  simulationDay,
  onOpenAvailableBreakdown,
  onNavigateCommitments,
  onNavigateCashflow,
  onNavigateRecovery,
}) => {
  // Resilience color mapping
  const getResilienceBadge = () => {
    if (metrics.resilienceRating === 'At Risk') {
      return {
        bg: 'bg-red-950/40 border-red-800/80 text-red-300',
        icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
        label: 'At Risk',
      };
    }
    if (metrics.resilienceRating === 'Needs Attention') {
      return {
        bg: 'bg-amber-950/40 border-amber-800/80 text-amber-300',
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        label: 'Needs Attention',
      };
    }
    return {
      bg: 'bg-teal-950/40 border-teal-800/80 text-teal-300',
      icon: <ShieldCheck className="w-4 h-4 text-teal-400" />,
      label: 'Resilient',
    };
  };

  const resilienceBadge = getResilienceBadge();

  return (
    <div className="space-y-4">
      {/* 4 Primary Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available to Spend */}
        <div
          onClick={onOpenAvailableBreakdown}
          className="bg-neutral-900 border border-neutral-800 hover:border-teal-500/60 rounded-2xl p-5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onOpenAvailableBreakdown()}
          aria-label="Available to Spend Details"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-teal-400" />
                Available to Spend
              </span>
              <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight my-1">
              {formatINR(metrics.safeDiscretionaryRemaining)}
            </div>

            <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
              Safe discretionary funds after ₹{metrics.unpaidEssentialCommitments} essential bills & ₹{metrics.protectedReserve} reserve floor.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center justify-between text-[11px] text-teal-400 font-medium">
            <span>View Calculation Model</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Upcoming Commitments */}
        <div
          onClick={onNavigateCommitments}
          className="bg-neutral-900 border border-neutral-800 hover:border-teal-500/60 rounded-2xl p-5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateCommitments()}
          aria-label="Upcoming Commitments Details"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-red-400" />
                Upcoming Commitments
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Day {simulationDay}–30</span>
            </div>

            <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight my-1">
              {formatINR(metrics.totalCommittedOutflow)}
            </div>

            {nextCommitment ? (
              <p className="text-[11px] text-neutral-400 truncate mt-1">
                Next: <strong className="text-neutral-200">{nextCommitment.title}</strong> ({formatINR(nextCommitment.amount)}) on Day {nextCommitment.dueDay}.
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-1">
                No unpaid obligations remaining in horizon.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center justify-between text-[11px] text-teal-400 font-medium">
            <span>Inspect Scheduled Obligations</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Projected Month-End Cash */}
        <div
          onClick={onNavigateCashflow}
          className="bg-neutral-900 border border-neutral-800 hover:border-teal-500/60 rounded-2xl p-5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateCashflow()}
          aria-label="Projected Month-End Cash Details"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                Month-End Cash (Day 30)
              </span>
              {previewOption && (
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.2 rounded">
                  Scenario Preview
                </span>
              )}
            </div>

            <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight my-1">
              {formatINR(metrics.monthEndBalance)}
            </div>

            <p className="text-[11px] text-neutral-400 mt-1">
              {previewOption
                ? `Includes simulated ${previewOption.label} (${formatINR(-previewOption.amount, true)}).`
                : 'Projected closing position under active baseline plan.'}
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center justify-between text-[11px] text-teal-400 font-medium">
            <span>View 30-Day Cashflow</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Financial Resilience */}
        <div
          onClick={onNavigateRecovery}
          className="bg-neutral-900 border border-neutral-800 hover:border-teal-500/60 rounded-2xl p-5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigateRecovery()}
          aria-label="Financial Resilience Details"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                Financial Resilience
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${resilienceBadge.bg}`}>
                {resilienceBadge.icon}
                {resilienceBadge.label}
              </span>
            </div>

            <div className="text-xl font-bold text-white font-mono my-2 flex items-baseline gap-2">
              <span>{metrics.resilienceRating}</span>
              <span className="text-xs text-neutral-400 font-normal">
                ({metrics.stressPassingPercentage}% Shocks Passed)
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
              {metrics.firstBreachDay !== null
                ? `Constraint breach projected on Day ${metrics.firstBreachDay}. Recovery action required.`
                : `Maintains safety buffer above ₹${metrics.protectedReserve} reserve throughout all 30 days.`}
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center justify-between text-[11px] text-teal-400 font-medium">
            <span>Explore Risk & Recovery Options</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* At-a-Glance Operational Metric Strip */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold block">
              Total Committed Outflow
            </span>
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {formatINR(metrics.totalCommittedOutflow)}
            </span>
            <span className="text-[10px] text-neutral-500 block">Pending bills scheduled</span>
          </div>
        </div>

        <div className="sm:pl-4 pt-3 sm:pt-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold block">
              Pending Income Inflow
            </span>
            <span className="text-sm font-bold text-teal-300 font-mono tabular-nums">
              {formatINR(metrics.pendingIncomeAmount)}
            </span>
            <span className="text-[10px] text-neutral-500 block">Freelance milestone expected</span>
          </div>
        </div>

        <div className="sm:pl-4 pt-3 sm:pt-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold block">
              Burn Rate Trend
            </span>
            <span className="text-sm font-bold text-neutral-200 font-mono tabular-nums">
              ~{formatINR(metrics.burnRateDailyAverage)}/day
            </span>
            <span className="text-[10px] text-neutral-500 block">Net average daily drawdown</span>
          </div>
        </div>
      </div>

      {/* Secondary Contextual Indicators Bar (Prioritized, uncluttered) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Lowest Projected Balance
          </span>
          <div className="font-mono font-bold text-white tabular-nums">
            {formatINR(metrics.lowestProjectedBalance)}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Occurs on Day {metrics.lowestProjectedDay}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Next Financial Risk Date
          </span>
          <div className={`font-mono font-bold tabular-nums ${
            metrics.firstBreachDay ? 'text-amber-400' : 'text-teal-300'
          }`}>
            {metrics.firstBreachDay ? `Day ${metrics.firstBreachDay}` : 'No Shortfall'}
          </div>
          <span className="text-[10px] text-neutral-500">
            {metrics.firstBreachDay ? 'Breaches reserve floor' : '30-day runway clear'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Emergency Hard Reserve
          </span>
          <div className="font-mono font-bold text-white tabular-nums">
            {formatINR(metrics.protectedReserve)}
          </div>
          <span className="text-[10px] text-neutral-500">
            Locked safety threshold
          </span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Stress Test Resilience
          </span>
          <div className="font-mono font-bold text-teal-300 tabular-nums">
            {metrics.stressPassingPercentage}% Passed
          </div>
          <span className="text-[10px] text-neutral-500">
            Across standard shock models
          </span>
        </div>
      </div>
    </div>
  );
};
