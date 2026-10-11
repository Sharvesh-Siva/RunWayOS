/**
 * RunwayOS — Decision Lab Scenario Comparison Visualization
 * Compares 4 alternatives:
 * 1. Buy Now
 * 2. Cheaper Alternative
 * 3. Delay Purchase
 * 4. Keep Current Plan
 *
 * Compares: Minimum Projected Balance & Month-End Cash with Reserve Floor marker.
 */

import React from 'react';
import { DecisionOption, DayForecast } from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';

interface ScenarioComparisonItem {
  option: DecisionOption;
  lowestBalance: number;
  monthEndBalance: number;
  isBreached: boolean;
  firstBreachDay: number | null;
}

interface ScenarioComparisonChartProps {
  items: ScenarioComparisonItem[];
  selectedOptionId: string;
  onSelectOption: (id: string) => void;
  minimumReserve: number;
}

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({
  items,
  selectedOptionId,
  onSelectOption,
  minimumReserve,
}) => {
  const maxVal = Math.max(
    ...items.map((i) => Math.max(i.lowestBalance, i.monthEndBalance, minimumReserve)),
    6000
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Decision Alternatives Comparison
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Side-by-side evaluation of Lowest Balance & Month-End Cash against ₹{minimumReserve} safety floor
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-3 h-2.5 rounded-xs bg-teal-400 inline-block"></span>
            Lowest Balance
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <span className="w-3 h-2.5 rounded-xs bg-neutral-600 inline-block"></span>
            Month-End Cash
          </span>
        </div>
      </div>

      {/* Grouped Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const isSelected = item.option.id === selectedOptionId;
          const lowestHeightPct = Math.max(10, Math.min(100, Math.round((Math.max(0, item.lowestBalance) / maxVal) * 100)));
          const monthEndHeightPct = Math.max(10, Math.min(100, Math.round((Math.max(0, item.monthEndBalance) / maxVal) * 100)));

          return (
            <div
              key={item.option.id}
              onClick={() => onSelectOption(item.option.id)}
              className={`rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-800/90 border-teal-400 ring-1 ring-teal-400 shadow-md'
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[120px]">
                    {item.option.amount === 0 ? 'Baseline' : `Cost: ${formatINR(item.option.amount)}`}
                  </span>
                  {item.isBreached ? (
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Breach
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Viable
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-3 line-clamp-1">
                  {item.option.label}
                </h4>

                {/* Grouped Bars Visual */}
                <div className="h-28 bg-neutral-950/80 rounded-lg p-2 flex items-end justify-center gap-3 border border-neutral-850 relative mb-3">
                  {/* Reserve Line in miniature bar */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-amber-500/60 z-10 pointer-events-none"
                    style={{
                      bottom: `${Math.round((minimumReserve / maxVal) * 100)}%`,
                    }}
                    title={`Reserve floor: ₹${minimumReserve}`}
                  />

                  {/* Lowest Projected Bar */}
                  <div className="flex flex-col items-center h-full justify-end w-7">
                    <span className="text-[9px] font-mono text-neutral-400 mb-1">
                      {Math.round(item.lowestBalance / 1000)}k
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.isBreached ? 'bg-amber-500' : isSelected ? 'bg-teal-400' : 'bg-teal-500/70'
                      }`}
                      style={{ height: `${lowestHeightPct}%` }}
                    />
                  </div>

                  {/* Month-End Bar */}
                  <div className="flex flex-col items-center h-full justify-end w-7">
                    <span className="text-[9px] font-mono text-neutral-400 mb-1">
                      {Math.round(item.monthEndBalance / 1000)}k
                    </span>
                    <div
                      className="w-full rounded-t bg-neutral-600 transition-all"
                      style={{ height: `${monthEndHeightPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="pt-2 border-t border-neutral-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-sans text-[10px]">Lowest:</span>
                  <span className={`tabular-nums font-semibold ${
                    item.isBreached ? 'text-amber-400' : 'text-teal-300'
                  }`}>
                    {formatINR(item.lowestBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-sans text-[10px]">Month-End:</span>
                  <span className="text-neutral-200 tabular-nums">
                    {formatINR(item.monthEndBalance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
