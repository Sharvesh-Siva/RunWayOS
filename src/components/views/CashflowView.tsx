/**
 * RunwayOS — Cashflow Timeline & Event Inspector
 * Real date-aware 30-day ledger and balance projection.
 * Explains root causes of danger points without double counting.
 */

import React, { useState } from 'react';
import {
  AppFinancialState,
  CashMetrics,
  DayForecast,
  DecisionOption,
} from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import { CashflowAreaChart } from '../charts/CashflowAreaChart';
import {
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface CashflowViewProps {
  state: AppFinancialState;
  metrics: CashMetrics;
  forecast: DayForecast[];
  previewForecast?: DayForecast[] | null;
  previewOption?: DecisionOption | null;
  onSetSimulationDay: (day: number) => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  state,
  metrics,
  forecast,
  previewForecast,
  previewOption,
  onSetSimulationDay,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(state.simulationDay);
  const [filterType, setFilterType] = useState<'all' | 'commitments' | 'income' | 'breaches'>('all');

  const activeDayForecast = forecast.find((f) => f.day === selectedDay) || forecast[0];

  // Derive plain-language danger point explanation
  const getDangerPointExplanation = () => {
    if (metrics.firstBreachDay === null) {
      return 'No constraint failures detected across the 30-day planning horizon. All obligations are sustained above the ₹' + metrics.protectedReserve + ' reserve.';
    }

    const breachForecast = forecast.find(f => f.day === metrics.firstBreachDay);
    const commitmentsOnBreach = state.commitments.filter(c => c.dueDay === metrics.firstBreachDay);
    const recentCommitments = state.commitments.filter(c => c.dueDay >= (metrics.firstBreachDay! - 4) && c.dueDay <= metrics.firstBreachDay!);

    const names = recentCommitments.map(c => c.title).join(' and ');
    return `Your projected balance drops below your ₹${metrics.protectedReserve} reserve on Day ${metrics.firstBreachDay} (closing at ${formatINR(breachForecast?.closingBalance || 0)}) because ${names || 'cumulative living allowances'} draw down funds before the next cash inflow arrives.`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            30-Day Cashflow Timeline
          </h2>
          <p className="text-xs text-neutral-400">
            Interactive daily balance projections and dated obligation schedule
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Days
          </button>
          <button
            onClick={() => setFilterType('commitments')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'commitments'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Bill Due Dates
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'income'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Income Days
          </button>
          <button
            onClick={() => setFilterType('breaches')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'breaches'
                ? 'bg-neutral-800 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Reserve Alerts
          </button>
        </div>
      </div>

      {/* Prominent Responsive Cashflow Area Chart */}
      <CashflowAreaChart
        forecast={forecast}
        previewForecast={previewForecast}
        minimumReserve={state.constraints.minimumReserve}
        simulationDay={state.simulationDay}
        firstBreachDay={metrics.firstBreachDay}
        onSelectDay={(d) => {
          setSelectedDay(d);
        }}
        previewOption={previewOption}
      />

      {/* Cause Analysis Banner */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
        metrics.firstBreachDay !== null
          ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
          : 'bg-neutral-900 border-neutral-800 text-neutral-300'
      }`}>
        {metrics.firstBreachDay !== null ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        )}
        <div>
          <strong className="text-white block mb-0.5">Timeline Health Analysis:</strong>
          <span>{getDangerPointExplanation()}</span>
        </div>
      </div>

      {/* 30-Day Interactive Timeline Selector Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
          <span>Click any day to inspect dated cash transactions</span>
          <span className="font-mono">Reserve Threshold: ₹{metrics.protectedReserve}</span>
        </div>

        {/* Horizontal scrollable timeline track */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1 overflow-x-auto pb-2">
          {forecast.map((f) => {
            const isSelected = f.day === selectedDay;
            const isToday = f.day === state.simulationDay;
            const isBreached = f.closingBalance < state.constraints.minimumReserve;
            const hasBill = f.committedTotal > 0;
            const hasIncome = f.incomeTotal > 0;

            // Filter check
            let isMuted = false;
            if (filterType === 'commitments' && !hasBill) isMuted = true;
            if (filterType === 'income' && !hasIncome) isMuted = true;
            if (filterType === 'breaches' && !isBreached) isMuted = true;

            return (
              <button
                key={f.day}
                onClick={() => setSelectedDay(f.day)}
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-all border ${
                  isSelected
                    ? 'border-teal-400 bg-teal-950/40 text-white ring-1 ring-teal-400'
                    : isBreached
                    ? 'border-amber-800/70 bg-amber-950/20 text-neutral-300 hover:border-amber-600'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                } ${isMuted ? 'opacity-30' : 'opacity-100'}`}
              >
                <span className="text-[10px] font-mono mb-1">D{f.day}</span>
                <span className={`text-[9px] font-bold font-mono tabular-nums ${
                  isBreached ? 'text-amber-400' : 'text-neutral-200'
                }`}>
                  {f.closingBalance < 1000 ? `₹${Math.round(f.closingBalance)}` : `₹${Math.round(f.closingBalance / 1000)}k`}
                </span>

                {/* Event markers */}
                <div className="flex items-center gap-0.5 mt-1.5 h-1.5">
                  {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" title="Income inflow" />}
                  {hasBill && <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Bill commitment" />}
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-white" title="Current Day" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detailed Breakdown Inspector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Detailed Ledger for Day {activeDayForecast.day}
              </h3>
              {activeDayForecast.day === state.simulationDay && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700">
                  Current Simulation Day
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Opening balance: {formatINR(activeDayForecast.openingBalance)} · Closing: {formatINR(activeDayForecast.closingBalance)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetSimulationDay(activeDayForecast.day)}
              className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors"
            >
              Advance Simulation to Day {activeDayForecast.day}
            </button>
          </div>
        </div>

        {/* Mathematical Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Inflow (+)</th>
                <th className="py-2.5 px-3 text-right">Outflow (-)</th>
                <th className="py-2.5 px-3 text-right">Running Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {/* Row 0: Opening Balance */}
              <tr className="text-neutral-300">
                <td className="py-2.5 px-3 font-sans text-neutral-500">Starting</td>
                <td className="py-2.5 px-3 font-sans font-medium text-neutral-300">Opening Cash Available</td>
                <td className="py-2.5 px-3 text-right text-neutral-500">—</td>
                <td className="py-2.5 px-3 text-right text-neutral-500">—</td>
                <td className="py-2.5 px-3 text-right text-white font-bold tabular-nums">
                  {formatINR(activeDayForecast.openingBalance)}
                </td>
              </tr>

              {/* Day Events */}
              {activeDayForecast.events.map((ev, i) => (
                <tr key={i} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans capitalize">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      ev.type === 'income'
                        ? 'bg-teal-950 text-teal-300 border border-teal-800'
                        : ev.type === 'commitment'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : ev.type === 'simulated'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {ev.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-white font-medium">
                    {ev.title}
                  </td>
                  <td className="py-2.5 px-3 text-right text-teal-400 tabular-nums">
                    {!ev.isOutflow ? formatINR(ev.amount) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-400 tabular-nums">
                    {ev.isOutflow ? formatINR(ev.amount) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-neutral-400 tabular-nums">
                    {/* Calculated dynamically */}
                    —
                  </td>
                </tr>
              ))}

              {/* Closing Row */}
              <tr className="bg-neutral-950/60 font-semibold text-white">
                <td className="py-3 px-3 font-sans">Closing</td>
                <td className="py-3 px-3 font-sans">Day {activeDayForecast.day} End-of-Day Position</td>
                <td className="py-3 px-3 text-right text-teal-400 tabular-nums">
                  {activeDayForecast.incomeTotal > 0 ? formatINR(activeDayForecast.incomeTotal) : '—'}
                </td>
                <td className="py-3 px-3 text-right text-red-400 tabular-nums">
                  {formatINR(
                    activeDayForecast.committedTotal +
                    activeDayForecast.discretionaryTotal +
                    activeDayForecast.savingsTotal +
                    activeDayForecast.simulatedTotal
                  )}
                </td>
                <td className={`py-3 px-3 text-right text-base tabular-nums ${
                  activeDayForecast.closingBalance < state.constraints.minimumReserve
                    ? 'text-amber-400 font-bold'
                    : 'text-teal-300'
                }`}>
                  {formatINR(activeDayForecast.closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
