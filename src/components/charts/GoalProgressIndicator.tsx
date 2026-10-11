/**
 * RunwayOS — Goal Progress Visualization
 * Circular radial indicator & progress breakdown:
 * - Current amount deposited/saved
 * - Target amount
 * - Remaining amount to goal
 * - Target deadline day
 * - Feasibility indicator under active forecast
 */

import React from 'react';
import { SavingsGoal, CashMetrics } from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoalProgressIndicatorProps {
  goal: SavingsGoal;
  metrics: CashMetrics;
  simulationDay: number;
}

export const GoalProgressIndicator: React.FC<GoalProgressIndicatorProps> = ({
  goal,
  metrics,
  simulationDay,
}) => {
  const percentSaved = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const daysRemaining = Math.max(0, goal.targetDay - simulationDay);

  // Projected planned deposits through target day
  const plannedFutureDeposits = goal.allocatedDaily * daysRemaining;
  const projectedTotal = goal.currentAmount + plannedFutureDeposits;
  const isGoalFeasible = projectedTotal >= goal.targetAmount && !metrics.isAtRisk;

  // SVG Radial circle setup
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentSaved / 100) * circumference;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 text-xs text-neutral-400">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-teal-400" />
          {goal.title}
        </span>
        <span className="font-mono text-[11px] text-teal-300">
          Target Day {goal.targetDay}
        </span>
      </div>

      <div className="flex items-center gap-5 my-3">
        {/* Radial Circle */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#262626"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {percentSaved}%
            </span>
            <span className="text-[9px] text-neutral-400 uppercase tracking-wider">
              Secured
            </span>
          </div>
        </div>

        {/* Numbers breakdown */}
        <div className="flex-1 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-neutral-400 font-sans">Current Saved:</span>
            <span className="text-white font-bold tabular-nums">
              {formatINR(goal.currentAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400 font-sans">Target Goal:</span>
            <span className="text-neutral-300 tabular-nums">
              {formatINR(goal.targetAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400 font-sans">Remaining:</span>
            <span className="text-teal-400 tabular-nums">
              {formatINR(remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Feasibility Notice */}
      <div className="pt-3 border-t border-neutral-800 text-[11px] flex items-center justify-between text-neutral-400">
        <div className="flex items-center gap-1.5">
          {isGoalFeasible ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span>
            {isGoalFeasible
              ? 'On track with ₹' + goal.allocatedDaily + '/day transfer'
              : 'At risk due to upcoming cash constraints'}
          </span>
        </div>
        <span className="font-mono text-neutral-500">
          {daysRemaining} days left
        </span>
      </div>
    </div>
  );
};
