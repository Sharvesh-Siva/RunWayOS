/**
 * RunwayOS — Reconciled Money Allocation Visualization
 * Non-overlapping decomposition of current settled funds:
 * 1. Essential Commitments (Scheduled upcoming shelter & utilities)
 * 2. Protected Reserve Floor (User-defined safety floor)
 * 3. Savings Goals (Transferred capital)
 * 4. Flexible / Unallocated Discretionary Cash
 *
 * Mathematically reconciled to 100% of current cash held.
 */

import React, { useState } from 'react';
import { MoneyAllocation } from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { Info, PieChart, ShieldCheck } from 'lucide-react';

interface MoneyAllocationChartProps {
  allocation: MoneyAllocation;
}

export const MoneyAllocationChart: React.FC<MoneyAllocationChartProps> = ({ allocation }) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const {
    totalFunds,
    essentialCommitments,
    protectedReserve,
    savingsGoals,
    flexibleDiscretionary,
  } = allocation;

  // Segments definition with non-overlapping mathematics
  const segments = [
    {
      id: 'essential',
      label: 'Essential Commitments',
      amount: essentialCommitments,
      color: '#F87171', // red-400
      secondaryColor: '#991B1B',
      description: 'Funds earmarked for non-negotiable upcoming shelter (PG rent) & utilities.',
    },
    {
      id: 'reserve',
      label: 'Protected Reserve Floor',
      amount: protectedReserve,
      color: '#FBBF24', // amber-400
      secondaryColor: '#92400E',
      description: 'Hard safety buffer locked to absorb unforeseen disruptions.',
    },
    {
      id: 'savings',
      label: 'Savings Milestones',
      amount: savingsGoals,
      color: '#38BDF8', // sky-400
      secondaryColor: '#075985',
      description: 'Active capital deposited toward your emergency fund goal.',
    },
    {
      id: 'flexible',
      label: 'Flexible / Discretionary',
      amount: flexibleDiscretionary,
      color: '#2DD4BF', // teal-400
      secondaryColor: '#115E59',
      description: 'Free liquidity available for daily living allowance and optional choices.',
    },
  ];

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            Current Funds Allocation
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Non-overlapping partition of settled cash ({formatINR(totalFunds)})
          </p>
        </div>

        <span className="text-[11px] font-mono text-teal-300 px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
          Reconciled 100%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#262626"
                strokeWidth={strokeWidth}
              />

              {/* Segment arcs */}
              {segments.map((seg) => {
                const percent = totalFunds > 0 ? seg.amount / totalFunds : 0;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += percent;

                const isHovered = activeSegment === seg.id;

                return (
                  <circle
                    key={seg.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setActiveSegment(seg.id)}
                    onMouseLeave={() => setActiveSegment(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-neutral-400 uppercase font-sans tracking-wider">
                Total Cash
              </span>
              <span className="text-sm font-bold text-white font-mono tabular-nums">
                {formatINR(totalFunds)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown List & Explanations */}
        <div className="md:col-span-7 space-y-2.5">
          {segments.map((seg) => {
            const pct = totalFunds > 0 ? Math.round((seg.amount / totalFunds) * 100) : 0;
            const isHovered = activeSegment === seg.id;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setActiveSegment(seg.id)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-neutral-800/80 border-neutral-600 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-semibold text-white">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-200 font-bold tabular-nums">
                      {formatINR(seg.amount)}
                    </span>
                    <span className="text-neutral-400 text-[11px] tabular-nums">
                      ({pct}%)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 pl-4.5 leading-relaxed">
                  {seg.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accounting Distinction Disclaimer */}
      <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
        <span>
          <strong>Operational Distinction:</strong> Essential commitments are held in bank cash and scheduled to exit on due dates; they are not deducted twice. Unallocated funds remain fully flexible.
        </span>
      </div>
    </div>
  );
};
