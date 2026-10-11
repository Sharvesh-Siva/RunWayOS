/**
 * RunwayOS — Overview Screen: "What needs my attention?"
 * Premium financial overview with concise summary cards,
 * interactive 30-day area chart, reconciled funds allocation,
 * and deterministic scenario triggers.
 */

import React, { useState } from 'react';
import {
  AppFinancialState,
  CashMetrics,
  DayForecast,
  DecisionOption,
} from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { QuickSummaryCards } from '../overview/QuickSummaryCards';
import { CashflowAreaChart } from '../charts/CashflowAreaChart';
import { MoneyAllocationChart } from '../charts/MoneyAllocationChart';
import { GoalProgressIndicator } from '../charts/GoalProgressIndicator';
import { AvailableToSpendModal } from '../modals/AvailableToSpendModal';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Target,
  Zap,
} from 'lucide-react';

interface OverviewViewProps {
  state: AppFinancialState;
  metrics: CashMetrics;
  forecast: DayForecast[];
  previewOption?: DecisionOption | null;
  previewForecast?: DayForecast[] | null;
  onNavigateTab: (tab: 'overview' | 'cashflow' | 'decision_lab' | 'recovery' | 'activity' | 'history') => void;
  onLaunchJourney: (journey: 'A' | 'B' | 'C' | 'D') => void;
  onOpenTestDecision: () => void;
  onSelectDay?: (day: number) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  metrics,
  forecast,
  previewOption,
  previewForecast,
  onNavigateTab,
  onLaunchJourney,
  onOpenTestDecision,
  onSelectDay,
}) => {
  const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false);

  const nextCommitment = state.commitments
    .filter(c => c.dueDay >= state.simulationDay && c.status === 'due')
    .sort((a, b) => a.dueDay - b.dueDay)[0];

  const essentialCommitments = state.commitments.filter(
    c => c.dueDay >= state.simulationDay && c.status === 'due' && c.priority === 'essential'
  );

  const primaryGoal = state.goals[0];

  // Derive plain-language status statement
  const getStatusSummary = () => {
    if (metrics.firstBreachDay !== null) {
      return {
        isWarning: true,
        headline: `Projected Cashflow Shortfall on Day ${metrics.firstBreachDay}`,
        detail: `Expected balance drops below your ₹${metrics.protectedReserve} reserve. Review ranked recovery actions in Recovery Center.`,
      };
    }
    if (nextCommitment) {
      const daysUntil = nextCommitment.dueDay - state.simulationDay;
      const timingText = daysUntil === 0 ? 'due today' : `due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
      return {
        isWarning: false,
        headline: 'Financial Plan Operating Within Safe Runway',
        detail: `Next obligation: ${nextCommitment.title} (${formatINR(nextCommitment.amount)}) is ${timingText} on Day ${nextCommitment.dueDay}.`,
      };
    }
    return {
      isWarning: false,
      headline: 'Month-End Runway Fully Clear',
      detail: 'All known commitments and daily allowances are covered through Day 30.',
    };
  };

  const status = getStatusSummary();

  return (
    <div className="space-y-6">
      {/* 1. Quick Summary Cards & Indicators Section */}
      <QuickSummaryCards
        metrics={metrics}
        nextCommitment={nextCommitment}
        primaryGoal={primaryGoal}
        previewOption={previewOption}
        simulationDay={state.simulationDay}
        onOpenAvailableBreakdown={() => setIsAvailableModalOpen(true)}
        onNavigateCommitments={() => onNavigateTab('activity')}
        onNavigateCashflow={() => onNavigateTab('cashflow')}
        onNavigateRecovery={() => onNavigateTab('recovery')}
      />

      {/* 2. Prominent 30-Day Cashflow Area Chart */}
      <CashflowAreaChart
        forecast={forecast}
        previewForecast={previewForecast}
        minimumReserve={state.constraints.minimumReserve}
        simulationDay={state.simulationDay}
        firstBreachDay={metrics.firstBreachDay}
        onSelectDay={onSelectDay}
        previewOption={previewOption}
      />

      {/* 3. Reconciled Money Allocation & Savings Goal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <MoneyAllocationChart allocation={metrics.allocation} />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {primaryGoal && (
            <GoalProgressIndicator
              goal={primaryGoal}
              metrics={metrics}
              simulationDay={state.simulationDay}
            />
          )}

          {/* Contextual Action Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Operational Status · Day {state.simulationDay}
                </span>
                {status.isWarning ? (
                  <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Action Needed
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-teal-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Nominal
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{status.headline}</h4>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">{status.detail}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-neutral-800">
              <button
                onClick={onOpenTestDecision}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test a Decision</span>
              </button>
              {status.isWarning && (
                <button
                  onClick={() => onNavigateTab('recovery')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-800/80 font-medium text-xs rounded-lg transition-colors"
                >
                  <span>Open Recovery Options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Guided Evaluation Scenarios Deck */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              Guided Evaluation Scenarios
            </h3>
            <p className="text-xs text-neutral-400">
              Observe deterministic calculations updating across summary cards, area chart, and cash allocation:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => onLaunchJourney('A')}
            className="text-left p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-teal-500/40 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-teal-300 mb-1">
              <span>Journey A</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-xs font-medium text-white mb-0.5">Purchase Decision</div>
            <p className="text-[11px] text-neutral-400 line-clamp-2">
              Compare ₹2,000 buy now vs ₹1,400 alternative vs wait for Day 14 milestone.
            </p>
          </button>

          <button
            onClick={() => onLaunchJourney('B')}
            className="text-left p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
              <span>Journey B</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-xs font-medium text-white mb-0.5">Emergency Expense Shock</div>
            <p className="text-[11px] text-neutral-400 line-clamp-2">
              Simulate sudden ₹1,500 repair on Day 8 and examine breach points.
            </p>
          </button>

          <button
            onClick={() => onLaunchJourney('C')}
            className="text-left p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
              <span>Journey C</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-xs font-medium text-white mb-0.5">Delayed Freelance Income</div>
            <p className="text-[11px] text-neutral-400 line-clamp-2">
              Client stipend delayed by 10 days; test cascade on broadband & living funds.
            </p>
          </button>

          <button
            onClick={() => onLaunchJourney('D')}
            className="text-left p-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-teal-500/40 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-teal-300 mb-1">
              <span>Journey D</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-xs font-medium text-white mb-0.5">Recovery Workflow</div>
            <p className="text-[11px] text-neutral-400 line-clamp-2">
              Detect active constraint failure and commit ranked recovery proposals.
            </p>
          </button>
        </div>
      </div>

      {/* Available to Spend Calculation Breakdown Modal */}
      <AvailableToSpendModal
        isOpen={isAvailableModalOpen}
        onClose={() => setIsAvailableModalOpen(false)}
        metrics={metrics}
        essentialCommitments={essentialCommitments}
        simulationDay={state.simulationDay}
      />
    </div>
  );
};
