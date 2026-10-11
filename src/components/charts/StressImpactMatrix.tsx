/**
 * RunwayOS — Stress-Test Impact Visualization
 * Evaluates baseline plan against standard stress shocks:
 * 1. Unexpected ₹500 expense
 * 2. Unexpected ₹1,000 expense
 * 3. Unexpected ₹1,500 expense
 * 4. Delayed freelance income (+10 Days)
 *
 * Shows: Lowest Balance, First Failed Constraint Day, Month-End Balance, Goal Feasibility.
 */

import React from 'react';
import { AppFinancialState } from '../../types/finance';
import {
  generateDailyForecast,
  calculateCashMetrics,
  formatINR,
} from '../../engine/financeEngine';
import { ShieldAlert, ShieldCheck, Activity, Target } from 'lucide-react';

interface StressImpactMatrixProps {
  state: AppFinancialState;
}

export const StressImpactMatrix: React.FC<StressImpactMatrixProps> = ({ state }) => {
  const currentDay = state.simulationDay;
  const minReserve = state.constraints.minimumReserve;

  // Run 5 scenarios deterministically
  const scenarios = [
    {
      id: 'baseline',
      name: 'Baseline Plan',
      description: 'Scheduled plan with no unexpected shocks.',
      stressOption: null,
    },
    {
      id: 'shock_500',
      name: 'Unexpected ₹500 Shock',
      description: 'Minor urgent medicine or transit incident.',
      stressOption: {
        id: 's500',
        name: 'Urgent ₹500 Outflow',
        description: 'Minor shock',
        type: 'unexpected_expense' as const,
        expenseAmount: 500,
        expenseDay: Math.min(30, currentDay + 3),
      },
    },
    {
      id: 'shock_1000',
      name: 'Unexpected ₹1,000 Shock',
      description: 'Hardware repair or required course material.',
      stressOption: {
        id: 's1000',
        name: 'Urgent ₹1,000 Outflow',
        description: 'Moderate shock',
        type: 'unexpected_expense' as const,
        expenseAmount: 1000,
        expenseDay: Math.min(30, currentDay + 3),
      },
    },
    {
      id: 'shock_1500',
      name: 'Emergency ₹1,500 Shock',
      description: 'Severe dental or urgent device replacement.',
      stressOption: {
        id: 's1500',
        name: 'Urgent ₹1,500 Outflow',
        description: 'Severe shock',
        type: 'unexpected_expense' as const,
        expenseAmount: 1500,
        expenseDay: Math.min(30, currentDay + 3),
      },
    },
    {
      id: 'delayed_income',
      name: 'Delayed Income (+10 Days)',
      description: 'Client payment delayed from Day 14 to Day 24.',
      stressOption: {
        id: 'delay_inc',
        name: 'Stipend Delay',
        description: 'Delayed income',
        type: 'delayed_income' as const,
        incomeDelayDays: 10,
        incomeId: 'inc_freelance_14',
      },
    },
  ];

  const evaluations = scenarios.map((sc) => {
    const fcast = generateDailyForecast(state, {
      stressScenario: sc.stressOption,
    });
    const met = calculateCashMetrics(state, fcast);
    const monthEnd = fcast[fcast.length - 1]?.closingBalance || 0;
    const goalFeasible = met.lowestProjectedBalance >= minReserve;

    return {
      ...sc,
      metrics: met,
      monthEnd,
      goalFeasible,
      isBreached: met.firstBreachDay !== null || met.lowestProjectedBalance < minReserve,
    };
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Financial Stress & Shock Resilience Matrix
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic simulation of sudden outflows and income timing delays against ₹{minReserve} floor
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-300 px-3 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
          Resilience: {evaluations.filter((e) => !e.isBreached).length} / {evaluations.length} Shocks Absorbed
        </div>
      </div>

      {/* Responsive Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 font-sans">Scenario</th>
              <th className="py-2.5 px-3 text-right">Lowest Balance</th>
              <th className="py-2.5 px-3 text-center font-sans">First Breach</th>
              <th className="py-2.5 px-3 text-right">Month-End Cash</th>
              <th className="py-2.5 px-3 text-center font-sans">Goal Protection</th>
              <th className="py-2.5 px-3 text-right font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {evaluations.map((ev) => (
              <tr
                key={ev.id}
                className={`hover:bg-neutral-800/40 transition-colors ${
                  ev.id === 'baseline' ? 'bg-neutral-950/40' : ''
                }`}
              >
                <td className="py-3 px-3 font-sans">
                  <span className="font-semibold text-white block">{ev.name}</span>
                  <span className="text-[11px] text-neutral-400 font-sans">{ev.description}</span>
                </td>

                <td className={`py-3 px-3 text-right font-bold tabular-nums ${
                  ev.isBreached ? 'text-amber-400' : 'text-teal-300'
                }`}>
                  {formatINR(ev.metrics.lowestProjectedBalance)}
                </td>

                <td className="py-3 px-3 text-center font-sans">
                  {ev.metrics.firstBreachDay ? (
                    <span className="text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">
                      Day {ev.metrics.firstBreachDay}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[11px]">None (Safe)</span>
                  )}
                </td>

                <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">
                  {formatINR(ev.monthEnd)}
                </td>

                <td className="py-3 px-3 text-center font-sans">
                  {ev.goalFeasible ? (
                    <span className="text-teal-400 text-[11px] font-medium flex items-center justify-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Intact
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[11px]">Deferred</span>
                  )}
                </td>

                <td className="py-3 px-3 text-right font-sans">
                  {ev.isBreached ? (
                    <span className="px-2 py-0.5 rounded text-[11px] bg-amber-950 text-amber-300 border border-amber-800 font-medium inline-flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Breached
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] bg-teal-950 text-teal-300 border border-teal-800 font-medium inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Resilient
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
