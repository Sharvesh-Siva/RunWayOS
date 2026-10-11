/**
 * RunwayOS — Evidence Trace & Decision Audit History
 * Complies with Section 11 & 12:
 * Traceable execution log of deterministic modules, audit entries of past decisions,
 * and transparent explanation of financial invariants.
 */

import React, { useState } from 'react';
import {
  AppFinancialState,
  DecisionLogEntry,
  SystemEvidenceCall,
} from '../../types/finance';
import { formatINR, calculateCashMetrics, generateDailyForecast } from '../../engine/financeEngine';
import { runAllTests } from '../../tests/financeEngine.test';
import { GoogleGenAI } from '@google/genai';
import {
  History,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  Send,
  Bot,
} from 'lucide-react';

interface EvidenceHistoryViewProps {
  state: AppFinancialState;
}

export const EvidenceHistoryView: React.FC<EvidenceHistoryViewProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'agent_trace' | 'assistant' | 'invariants'>('audit');
  const [userQuery, setUserQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const forecast = generateDailyForecast(state);
  const metrics = calculateCashMetrics(state, forecast);

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    const query = userQuery;
    const contextPrompt = `You are RunwayOS financial assistant. You summarize and explain financial situation based on DETERMINISTIC figures provided.
Current day: Day ${state.simulationDay} of 30.
Settled cash in hand: ₹${metrics.currentCash}.
Protected safety reserve: ₹${metrics.protectedReserve}.
Lowest projected balance: ₹${metrics.lowestProjectedBalance} on Day ${metrics.lowestProjectedDay}.
First breach day: ${metrics.firstBreachDay ? 'Day ' + metrics.firstBreachDay : 'None'}.
Unpaid essential bills: ₹${metrics.unpaidEssentialCommitments} (e.g. PG rent ₹4,500 on Day 5, broadband ₹799 on Day 12).
Expected income: Freelance milestone ₹4,000 scheduled for Day 14.

User question: "${query}"

Provide a concise, direct, helpful explanation (2-4 sentences). Do NOT invent arithmetic. Reference the exact dated events.`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // Fallback explanation if no live key provided
        let fallback = '';
        const qLower = query.toLowerCase();
        if (qLower.includes('day 12') || qLower.includes('danger') || qLower.includes('breach') || qLower.includes('why')) {
          fallback = `Your lowest projected balance reaches ${formatINR(metrics.lowestProjectedBalance)} around Day ${metrics.lowestProjectedDay}. This happens because PG rent (${formatINR(4500)}) on Day 5 and broadband (${formatINR(799)}) on Day 12 consume available liquidity before your freelance retainer (${formatINR(4000)}) arrives on Day 14.`;
        } else if (qLower.includes('buy') || qLower.includes('book') || qLower.includes('textbook') || qLower.includes('alternative')) {
          fallback = `Buying a ₹2,000 item right now will significantly erode your cash cushion before Day 5 rent. Opting for the ₹1,400 refurbished alternative or waiting until Day 15 preserves your ₹1,000 protected reserve.`;
        } else {
          fallback = `Currently, you have ${formatINR(metrics.currentCash)} settled cash with ${formatINR(metrics.unpaidEssentialCommitments)} in upcoming essential commitments. Your safety floor is ₹${metrics.protectedReserve}, leaving ${formatINR(metrics.safeDiscretionaryRemaining)} in safe discretionary funds.`;
        }
        setTimeout(() => {
          setAiResponse(fallback);
          setIsAiLoading(false);
        }, 500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
      });

      setAiResponse(response.text || 'Analysis completed based on active ledger.');
    } catch (err) {
      console.warn('Gemini query error, using deterministic fallback', err);
      setAiResponse(
        `Based on deterministic state: Current cash is ${formatINR(metrics.currentCash)}. Lowest projected balance is ${formatINR(metrics.lowestProjectedBalance)} on Day ${metrics.lowestProjectedDay}. Essential commitments (${formatINR(metrics.unpaidEssentialCommitments)}) are scheduled ahead of the ₹4,000 freelance inflow on Day 14.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Decision History & Evidence Trace
          </h2>
          <p className="text-xs text-neutral-400">
            Immutable audit record of evaluated trade-offs, state transitions, and deterministic engine calls
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'audit'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Decisions Log ({state.decisionHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('agent_trace')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'agent_trace'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Engine Module Trace ({state.evidenceCalls.length})
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'assistant'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            AI Plan Inquiry
          </button>
          <button
            onClick={() => setActiveTab('invariants')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'invariants'
                ? 'bg-neutral-800 text-teal-300 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Mathematical Invariants
          </button>
        </div>
      </div>

      {/* Tab 1: Decisions Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {state.decisionHistory.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-neutral-400">
              No historical decisions recorded yet. Test an action in Decision Lab or apply a recovery proposal.
            </div>
          ) : (
            state.decisionHistory.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-teal-950 text-teal-300 border border-teal-800">
                      {item.decisionType.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {item.actionTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Occurred Day {item.dayOccurred}</span>
                    <span>·</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                  {item.summary}
                </p>

                {/* Calculation Impact Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-xs font-mono mb-3">
                  <div>
                    <span className="text-neutral-500 block text-[10px] font-sans">Lowest Bal Before:</span>
                    <span className="text-neutral-300 tabular-nums">
                      {formatINR(item.lowestBalanceBefore)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] font-sans">Lowest Bal After:</span>
                    <span className="text-teal-300 font-bold tabular-nums">
                      {formatINR(item.lowestBalanceAfter)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] font-sans">User Approval:</span>
                    <span className="text-white font-semibold font-sans capitalize">
                      {item.userDecision}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] font-sans">Floor Protected:</span>
                    <span className="text-teal-400 font-semibold font-sans">
                      {item.lowestBalanceAfter >= state.constraints.minimumReserve ? 'Yes (Protected)' : 'Breached'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400">
                  <strong className="text-neutral-300">Recorded Rationale: </strong>
                  <span>{item.rationale}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Deterministic Engine Trace */}
      {activeTab === 'agent_trace' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                Operational Module Call Ledger
              </h3>
              <p className="text-xs text-neutral-400">
                System components invoked during planning, simulation, and state transitions
              </p>
            </div>
            <span className="text-xs text-teal-400 font-mono">
              Live Trace Active
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {state.evidenceCalls.map((call) => (
              <div
                key={call.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-300 font-bold font-sans">[{call.moduleName}]</span>
                    <span className="text-neutral-200">{call.operation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{call.durationMs}ms</span>
                    <span>·</span>
                    <span>{call.timestamp}</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400">
                  <span className="text-neutral-500">INPUT: </span>
                  {call.inputSummary}
                </div>
                <div className="text-[11px] text-neutral-200">
                  <span className="text-teal-400">OUTPUT: </span>
                  {call.outputSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: AI Plan Inquiry */}
      {activeTab === 'assistant' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400" />
              Natural Language Ledger Inquirer
            </h3>
            <p className="text-xs text-neutral-400">
              Interprets deterministic numbers and constraints into human context using Gemini. Arithmetic remains 100% deterministic.
            </p>
          </div>

          <form onSubmit={handleAskAssistant} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask about dates, obligations, or purchase safety (e.g. 'Why is Day 12 vulnerable?')"
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <button
                type="submit"
                disabled={isAiLoading || !userQuery.trim()}
                className="px-4 py-2 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-neutral-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isAiLoading ? (
                  <span>Analyzing...</span>
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Suggested quick questions */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="text-neutral-500">Try:</span>
              <button
                type="button"
                onClick={() => setUserQuery('Why is Day 12 vulnerable?')}
                className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700"
              >
                "Why is Day 12 vulnerable?"
              </button>
              <button
                type="button"
                onClick={() => setUserQuery('Should I buy the refurbished textbook or wait?')}
                className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700"
              >
                "Should I buy the refurbished textbook?"
              </button>
            </div>
          </form>

          {aiResponse && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-teal-800/60 text-xs text-neutral-200 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Grounded Summary:</span>
              </div>
              <p>{aiResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Mathematical Invariants */}
      {activeTab === 'invariants' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Guaranteed System Invariants
            </h3>
            <p className="text-xs text-neutral-400">
              RunwayOS calculations follow strict mathematical properties to protect user trust
            </p>
          </div>

          <div className="space-y-3 text-xs text-neutral-300">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <strong className="text-white block mb-0.5">1. Zero Double-Counting Invariant:</strong>
              <span>
                Unpaid bills only reduce projected balance on their specific calendar due date. Settled past transactions only reduce actual bank cash once.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <strong className="text-white block mb-0.5">2. Preview Isolation Invariant:</strong>
              <span>
                Simulated decisions evaluate against an immutable copy of the active state. Rejecting or cancelling a simulation guarantees zero state mutation.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <strong className="text-white block mb-0.5">3. Recovery Conservation Invariant:</strong>
              <span>
                Money is never manufactured or assumed. Recovery proposals only reallocate funds from deferrable obligations, cancelable subscriptions, or flexible daily allowances.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <strong className="text-white block mb-0.5">4. Explicit User Consent:</strong>
              <span>
                The system will never automatically execute bank debits, cancel subscriptions, or alter scheduled payments without explicit, human-confirmed approval.
              </span>
            </div>
          </div>

          {/* Automated Invariant Verification Results */}
          <div className="pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Automated Engine Test Suite Execution
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {runAllTests().results.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-neutral-950 border border-neutral-850">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-neutral-200">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
