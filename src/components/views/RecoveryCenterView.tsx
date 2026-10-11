/**
 * RunwayOS — Opportunity & Recovery Center
 * Automated conflict detection and ranked, constraint-aware recovery options.
 * Does not mutate budgets silently: all changes require explicit approval.
 */

import React, { useMemo, useState } from 'react';
import {
  AppFinancialState,
  CashMetrics,
  DayForecast,
  RecoveryAction,
} from '../../types/finance';
import {
  formatINR,
  generateRecoveryOptions,
  applyRecoveryAction,
} from '../../engine/financeEngine';
import { StressImpactMatrix } from '../charts/StressImpactMatrix';
import {
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface RecoveryCenterViewProps {
  state: AppFinancialState;
  metrics: CashMetrics;
  forecast: DayForecast[];
  onApplyAction: (updatedState: AppFinancialState, action: RecoveryAction) => void;
}

export const RecoveryCenterView: React.FC<RecoveryCenterViewProps> = ({
  state,
  metrics,
  forecast,
  onApplyAction,
}) => {
  const recoveryOptions = useMemo(() => generateRecoveryOptions(state, forecast), [state, forecast]);
  const [selectedActionId, setSelectedActionId] = useState<string>(
    recoveryOptions[0]?.id || ''
  );
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);


  const handleApproveAction = (action: RecoveryAction) => {
    const updatedState = applyRecoveryAction(state, action);
    onApplyAction(updatedState, action);
    setAppliedNotice(`Approved and committed: "${action.title}". Active plan updated.`);
    setTimeout(() => setAppliedNotice(null), 5000);
  };

  const isShortfallActive = metrics.firstBreachDay !== null || metrics.lowestProjectedBalance < metrics.protectedReserve;
  const shortfallAmount = Math.max(0, metrics.protectedReserve - metrics.lowestProjectedBalance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-teal-400" />
            Opportunity & Recovery Center
          </h2>
          <p className="text-xs text-neutral-400">
            Constraint-aware options ranked to defend your reserve floor and eliminate cash shortfalls
          </p>
        </div>

        {/* Shortfall Status Indicator */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
          isShortfallActive
            ? 'bg-amber-950/40 border-amber-800 text-amber-300'
            : 'bg-teal-950/40 border-teal-800 text-teal-300'
        }`}>
          {isShortfallActive ? (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Shortfall Identified: {formatINR(shortfallAmount)}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Runway Protected: Zero Shortfall</span>
            </>
          )}
        </div>
      </div>

      {/* Applied Confirmation Toast */}
      {appliedNotice && (
        <div className="p-4 bg-teal-950 border border-teal-700 rounded-xl text-xs text-teal-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Situation Diagnostic Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
              Active Vulnerability
            </span>
            <div className="text-base font-bold text-white">
              {isShortfallActive ? `Reserve Floor Breached on Day ${metrics.firstBreachDay}` : 'All Constraints Intact'}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isShortfallActive
                ? `Lowest projected balance drops to ${formatINR(metrics.lowestProjectedBalance)}, violating your ₹${metrics.protectedReserve} floor.`
                : `Lowest balance across the 30-day forecast is ${formatINR(metrics.lowestProjectedBalance)}, above the ₹${metrics.protectedReserve} floor.`}
            </p>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
              Recovery Objective
            </span>
            <div className="text-base font-bold text-teal-300 font-mono tabular-nums">
              {isShortfallActive ? `Free ${formatINR(shortfallAmount)} in Cash` : 'Optimize Discretionary Cushion'}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Actions are prioritized to defend essential shelter and utility obligations first.
            </p>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1">
              Ranking Principles
            </span>
            <div className="text-xs text-neutral-300 space-y-1 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400 font-bold">1.</span> Never touch shelter/PG rent (essential)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400 font-bold">2.</span> Target zero-penalty subscriptions first
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400 font-bold">3.</span> Flex discretionary grocery/transit buffer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress-Test Impact Visualization Matrix */}
      <StressImpactMatrix state={state} />

      {/* Ranked Recovery Proposals List */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          Ranked Recovery Proposals ({recoveryOptions.length})
        </h3>

        {recoveryOptions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-neutral-400">
            No recovery actions required. Current runway comfortably accommodates all obligations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recoveryOptions.map((action, index) => {
              const isSelected = action.id === selectedActionId;
              const willResolveDeficit = action.cashFreed >= shortfallAmount;

              return (
                <article
                  key={action.id}
                  className={`bg-neutral-900 rounded-2xl p-5 border transition-colors flex flex-col justify-between ${
                    isSelected ? 'border-teal-400 ring-1 ring-teal-400 shadow-lg' : 'border-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[11px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-neutral-400 font-medium capitalize">
                          {action.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-teal-300 tabular-nums">
                        Freed: +{formatINR(action.cashFreed)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5">{action.title}</h4>
                    <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                      {action.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 mb-4">
                      <strong className="text-neutral-300 block mb-0.5">Trade-off & Consequence:</strong>
                      <span>{action.tradeOff}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Effective Day {action.effectiveDay}</span>
                      {willResolveDeficit && (
                        <span className="text-teal-400 font-semibold ml-1">
                          · Restores Reserve Floor
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedActionId(action.id)}
                        className="px-3 py-1.5 border border-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg hover:border-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveAction(action)}
                        className="px-3.5 py-1.5 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                      >
                        <span>Approve Proposal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
