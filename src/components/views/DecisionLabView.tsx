/**
 * RunwayOS — Decision Lab
 * Structured financial sandbox comparing constrained alternatives.
 * Features deterministic preview, resilience evaluation, and safe state commit.
 */

import React, { useState } from 'react';
import {
  AppFinancialState,
  CashMetrics,
  DayForecast,
  DecisionOption,
} from '../../types/finance';
import {
  formatINR,
  generateDailyForecast,
  calculateCashMetrics,
} from '../../engine/financeEngine';
import { ScenarioComparisonChart } from '../charts/ScenarioComparisonChart';
import {
  Sparkles,
  Check,
  X,
  Eye,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface DecisionLabViewProps {
  state: AppFinancialState;
  baseMetrics: CashMetrics;
  baseForecast: DayForecast[];
  onCommitDecision: (
    option: DecisionOption,
    title: string,
    summary: string,
    rationale: string
  ) => void;
  onPreviewOption: (option: DecisionOption | null) => void;
  previewOption: DecisionOption | null;
}

export const DecisionLabView: React.FC<DecisionLabViewProps> = ({
  state,
  baseMetrics,
  baseForecast,
  onCommitDecision,
  onPreviewOption,
  previewOption,
}) => {
  const currentDay = state.simulationDay;

  // Pre-configured decision scenario (Journey A)
  const [purchaseTitle, setPurchaseTitle] = useState('Academic Textbook & Lab Kit');
  const [purchaseCategory, setPurchaseCategory] = useState('education');
  
  // 4 Alternatives compared side-by-side
  const options: DecisionOption[] = [
    {
      id: 'opt_buy_now',
      label: 'Buy Now (Brand New)',
      description: 'Purchase new equipment immediately on current simulation day.',
      day: currentDay,
      amount: 2000,
    },
    {
      id: 'opt_cheaper_alt',
      label: 'Buy Refurbished / Shared',
      description: 'Acquire verified second-hand copy or split cost with classmate.',
      day: currentDay,
      amount: 1400,
      isCheaperAlternative: true,
    },
    {
      id: 'opt_delay_day15',
      label: 'Wait Until Day 15',
      description: 'Delay purchase until client freelance retainer (₹4,000) clears on Day 14.',
      day: 15,
      amount: 2000,
      isDelay: true,
    },
    {
      id: 'opt_keep_plan',
      label: 'Keep Current Baseline Plan',
      description: 'Do not purchase. Rely on public campus library copy.',
      day: currentDay,
      amount: 0,
    },
  ];

  const [selectedOptionId, setSelectedOptionId] = useState<string>('opt_buy_now');
  const selectedOption = options.find((o) => o.id === selectedOptionId) || options[0];

  // Evaluate each option deterministically
  const evaluations = options.map((opt) => {
    const simForecast = opt.amount > 0 ? generateDailyForecast(state, { simulatedOption: opt }) : baseForecast;
    const simMetrics = calculateCashMetrics(state, simForecast);
    const balanceDiff = simMetrics.lowestProjectedBalance - baseMetrics.lowestProjectedBalance;

    // Check shock resilience: how large an emergency could be absorbed without breaching ₹1,000 reserve
    const shockResilience = Math.max(0, simMetrics.lowestProjectedBalance - state.constraints.minimumReserve);

    return {
      option: opt,
      forecast: simForecast,
      metrics: simMetrics,
      balanceDiff,
      shockResilience,
      isBreached: simMetrics.lowestProjectedBalance < state.constraints.minimumReserve,
      firstBreachDay: simMetrics.firstBreachDay,
    };
  });

  const activeEval = evaluations.find((e) => e.option.id === selectedOptionId)!;

  // Generate plain language explanation from real metrics
  const getPlainLanguageExplanation = () => {
    if (selectedOption.amount === 0) {
      return 'Keeping the current plan preserves ₹' + baseMetrics.lowestProjectedBalance + ' lowest balance and leaves a safe ₹' + (baseMetrics.lowestProjectedBalance - state.constraints.minimumReserve) + ' cushion above your reserve.';
    }

    if (activeEval.isBreached) {
      return `WARNING: ${selectedOption.label} causes a cashflow breach on Day ${activeEval.firstBreachDay}. Lowest balance drops to ${formatINR(activeEval.metrics.lowestProjectedBalance)}, violating your ₹${state.constraints.minimumReserve} floor before upcoming rent and broadband obligations.`;
    }

    if (selectedOption.isDelay) {
      return `Waiting until Day 15 maintains high resilience because Day 14's ₹4,000 freelance inflow replenishes cash before the ₹2,000 outflow occurs. Your lowest pre-milestone balance remains protected at ${formatINR(baseMetrics.lowestProjectedBalance)}.`;
    }

    if (selectedOption.isCheaperAlternative) {
      return `The refurbished alternative saves ₹600 upfront compared to buying new. Your lowest projected balance remains safe at ${formatINR(activeEval.metrics.lowestProjectedBalance)}, preserving a ₹${activeEval.shockResilience} emergency cushion.`;
    }

    return `Buying now for ${formatINR(selectedOption.amount)} remains mathematically viable, but reduces your lowest projected balance to ${formatINR(activeEval.metrics.lowestProjectedBalance)}. An unexpected expense above ₹${activeEval.shockResilience} would breach your safety reserve.`;
  };

  const handleApprove = () => {
    const rationale = getPlainLanguageExplanation();
    const summary = `Committed option: ${selectedOption.label} (${formatINR(selectedOption.amount)} on Day ${selectedOption.day}).`;
    onCommitDecision(selectedOption, purchaseTitle, summary, rationale);
    onPreviewOption(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            Decision Lab: Constrained Alternatives
          </h2>
          <p className="text-xs text-neutral-400">
            Compare trade-offs against the active 30-day cashflow without mutating current state
          </p>
        </div>

        {/* Preview status chip */}
        {previewOption && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/70 border border-purple-700/80 rounded-lg text-xs text-purple-200">
            <Eye className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Previewing "{previewOption.label}"</span>
            <button
              onClick={() => onPreviewOption(null)}
              className="text-purple-300 hover:text-white underline ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Target Decision Configuration Deck */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Proposed Purchase Item
            </label>
            <input
              type="text"
              value={purchaseTitle}
              onChange={(e) => setPurchaseTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Category
            </label>
            <select
              value={purchaseCategory}
              onChange={(e) => setPurchaseCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="education">Education & Courseware</option>
              <option value="equipment">Hardware & Tools</option>
              <option value="health">Health & Medical</option>
              <option value="transport">Transit & Mobility</option>
              <option value="other">General Living</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Current Simulation Point
            </label>
            <div className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 font-mono">
              Day {state.simulationDay} · Current Cash: {formatINR(baseMetrics.currentCash)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Comparison Visualization */}
      <ScenarioComparisonChart
        items={evaluations.map((ev) => ({
          option: ev.option,
          lowestBalance: ev.metrics.lowestProjectedBalance,
          monthEndBalance: ev.metrics.monthEndBalance,
          isBreached: ev.isBreached,
          firstBreachDay: ev.firstBreachDay,
        }))}
        selectedOptionId={selectedOptionId}
        onSelectOption={setSelectedOptionId}
        minimumReserve={state.constraints.minimumReserve}
      />

      {/* 4 Alternatives Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {evaluations.map((ev) => {
          const isSelected = ev.option.id === selectedOptionId;
          const isCurrentPreview = previewOption?.id === ev.option.id;

          return (
            <div
              key={ev.option.id}
              onClick={() => setSelectedOptionId(ev.option.id)}
              className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-900 border-teal-400 shadow-md ring-1 ring-teal-400'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-neutral-400">
                    Option {ev.option.id.includes('buy_now') ? '1' : ev.option.id.includes('cheaper') ? '2' : ev.option.id.includes('delay') ? '3' : '4'}
                  </span>
                  {ev.isBreached ? (
                    <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Breach
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Viable
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{ev.option.label}</h3>
                <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                  {ev.option.description}
                </p>

                {/* Amount and Timing */}
                <div className="py-2.5 border-y border-neutral-800/80 mb-4 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-sans">Outflow:</span>
                    <span className="text-white font-bold tabular-nums">
                      {formatINR(ev.option.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-sans">Execution:</span>
                    <span className="text-neutral-300 tabular-nums">
                      Day {ev.option.day}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-sans">Lowest Bal:</span>
                    <span className={`tabular-nums font-semibold ${
                      ev.isBreached ? 'text-amber-400' : 'text-teal-300'
                    }`}>
                      {formatINR(ev.metrics.lowestProjectedBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-sans">Emergency Shock:</span>
                    <span className="text-neutral-300 tabular-nums">
                      ₹{ev.shockResilience} max
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for this card */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewOption(isCurrentPreview ? null : ev.option);
                  }}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-medium border transition-colors ${
                    isCurrentPreview
                      ? 'bg-purple-900/60 border-purple-600 text-purple-200'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isCurrentPreview ? 'Exit Preview' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOptionId(ev.option.id);
                  }}
                  className={`py-1 px-2 rounded text-[11px] font-medium ${
                    isSelected ? 'bg-teal-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Select
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Alternative Deep-Dive & Commit Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
          <div>
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1 block">
              Evaluated Action: {selectedOption.label}
            </span>
            <h3 className="text-lg font-bold text-white mb-2">
              Decision Analysis & Trade-Off Summary
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
              {getPlainLanguageExplanation()}
            </p>
          </div>

          {/* Decision Commit Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onPreviewOption(previewOption ? null : selectedOption)}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewOption?.id === selectedOption.id ? 'Hide Preview' : 'Preview on Timeline'}</span>
            </button>

            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-neutral-950 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Update Active Plan</span>
            </button>
          </div>
        </div>

        {/* Detailed Impact Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-neutral-400 block mb-1">Immediate Cash Delta</span>
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {formatINR(-selectedOption.amount, true)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Applied on Day {selectedOption.day}</p>
          </div>

          <div>
            <span className="text-neutral-400 block mb-1">Net Lowest Balance</span>
            <span className={`font-mono text-base font-bold tabular-nums ${
              activeEval.isBreached ? 'text-amber-400' : 'text-teal-300'
            }`}>
              {formatINR(activeEval.metrics.lowestProjectedBalance)}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Floor: ₹{state.constraints.minimumReserve}</p>
          </div>

          <div>
            <span className="text-neutral-400 block mb-1">Upcoming Commitments</span>
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {activeEval.isBreached ? 'At Risk' : 'Protected'}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Rent (D5) & Broadband (D12)</p>
          </div>

          <div>
            <span className="text-neutral-400 block mb-1">Emergency Resilience</span>
            <span className="font-mono text-base font-bold text-neutral-200 tabular-nums">
              ₹{activeEval.shockResilience}
            </span>
            <p className="text-[11px] text-neutral-500 mt-0.5">Max sudden expense absorbed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
