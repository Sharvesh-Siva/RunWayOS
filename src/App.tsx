/**
 * RunwayOS — Personal Financial Operations Platform
 * Master Application Shell & Decision Orchestrator
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AppFinancialState,
  DecisionOption,
  RecoveryAction,
} from './types/finance';
import {
  calculateCashMetrics,
  generateDailyForecast,
} from './engine/financeEngine';
import {
  loadStoredState,
  saveStateToStorage,
  resetDemoState,
} from './engine/storage';
import { runAllTests } from './tests/financeEngine.test';

import { Navbar } from './components/layout/Navbar';
import { DemoBanner } from './components/layout/DemoBanner';
import { LoginView } from './components/auth/LoginView';
import { OverviewView } from './components/views/OverviewView';
import { CashflowView } from './components/views/CashflowView';
import { DecisionLabView } from './components/views/DecisionLabView';
import { RecoveryCenterView } from './components/views/RecoveryCenterView';
import { ActivityGoalsView } from './components/views/ActivityGoalsView';
import { EvidenceHistoryView } from './components/views/EvidenceHistoryView';
import { DecisionLauncherModal } from './components/modals/DecisionLauncherModal';

export default function App() {
  // Authentication & Demo view state
  const [inDemoWorkspace, setInDemoWorkspace] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('demo.analyst@runwayos.internal');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'cashflow' | 'decision_lab' | 'recovery' | 'activity' | 'history'
  >('overview');

  // Core Financial State
  const [financialState, setFinancialState] = useState<AppFinancialState>(() => loadStoredState());

  // Decision preview overlay (isolated from base state)
  const [previewOption, setPreviewOption] = useState<DecisionOption | null>(null);

  // Decision Launcher Modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // Automated Test Verification results
  const [testResults, setTestResults] = useState<{ passed: number; failed: number; results: string[] }>({
    passed: 0,
    failed: 0,
    results: [],
  });

  // Run automated invariant tests on startup
  useEffect(() => {
    const res = runAllTests();
    setTestResults(res);
  }, []);

  // Save financial state whenever modified
  useEffect(() => {
    saveStateToStorage(financialState);
  }, [financialState]);

  // Daily Forecast calculation (recomputed deterministically)
  const baseForecast = useMemo(() => {
    return generateDailyForecast(financialState);
  }, [financialState]);

  const previewForecast = useMemo(() => {
    if (!previewOption) return null;
    return generateDailyForecast(financialState, {
      simulatedOption: previewOption,
    });
  }, [financialState, previewOption]);

  const activeForecast = previewForecast || baseForecast;

  // Cash Metrics calculation
  const metrics = useMemo(() => {
    return calculateCashMetrics(financialState, activeForecast);
  }, [financialState, activeForecast]);

  // Handlers for state updates
  const handleSetSimulationDay = (day: number) => {
    setFinancialState((prev) => {
      const updated = structuredClone(prev);
      updated.simulationDay = day;

      updated.evidenceCalls.unshift({
        id: `ev_day_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        moduleName: 'Cashflow Forecaster',
        operation: 'Advance Simulation Day',
        inputSummary: `New simulation day: Day ${day}`,
        outputSummary: `Ledger recalculated from Day ${day} through Day 30`,
        durationMs: 2,
        status: 'success',
      });

      return updated;
    });
  };

  const handleResetDemo = () => {
    const fresh = resetDemoState();
    setFinancialState(fresh);
    setPreviewOption(null);
    setActiveTab('overview');
  };

  // Commit Decision in Decision Lab
  const handleCommitDecision = (
    option: DecisionOption,
    title: string,
    summary: string,
    rationale: string
  ) => {
    setFinancialState((prev) => {
      const updated = structuredClone(prev);

      if (option.amount > 0) {
        // Record as commitment or pending transaction
        updated.commitments.push({
          id: `com_${Date.now()}`,
          dueDay: option.day,
          title: `${title} (${option.label})`,
          amount: option.amount,
          category: 'education',
          priority: option.isCheaperAlternative ? 'flexible' : 'discretionary',
          status: 'due',
          isRecurring: false,
          canDefer: false,
        });
      }

      const beforeMetrics = calculateCashMetrics(prev, generateDailyForecast(prev));
      const afterMetrics = calculateCashMetrics(updated, generateDailyForecast(updated));

      // Append to Decision History audit log
      updated.decisionHistory.unshift({
        id: `dec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        dayOccurred: updated.simulationDay,
        actionTitle: `Decision Committed: ${title}`,
        decisionType: 'purchase_evaluated',
        summary,
        lowestBalanceBefore: beforeMetrics.lowestProjectedBalance,
        lowestBalanceAfter: afterMetrics.lowestProjectedBalance,
        userDecision: 'approved',
        rationale,
      });

      updated.evidenceCalls.unshift({
        id: `ev_commit_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        moduleName: 'Approval and State-Transition Handler',
        operation: 'Commit Decision to Active Plan',
        inputSummary: `Option: ${option.label} | Outflow: ₹${option.amount} on Day ${option.day}`,
        outputSummary: `Lowest balance transitioned to ₹${afterMetrics.lowestProjectedBalance}`,
        durationMs: 3,
        status: 'success',
      });

      return updated;
    });

    setActiveTab('cashflow');
  };

  // Apply Recovery Action
  const handleApplyRecovery = (updatedState: AppFinancialState, action: RecoveryAction) => {
    setFinancialState(updatedState);
  };

  // Launch Guided Demo Journeys (A, B, C, D)
  const handleLaunchJourney = (journey: 'A' | 'B' | 'C' | 'D') => {
    if (journey === 'A') {
      // Journey A: Purchase decision in Decision Lab
      setActiveTab('decision_lab');
    } else if (journey === 'B') {
      // Journey B: Emergency Expense Shock
      setFinancialState((prev) => {
        const updated = structuredClone(prev);
        updated.commitments.push({
          id: `com_emergency_${Date.now()}`,
          dueDay: Math.min(30, updated.simulationDay + 2),
          title: 'Emergency Medical & Dental Expense',
          amount: 1500,
          category: 'health',
          priority: 'essential',
          status: 'due',
          isRecurring: false,
          canDefer: false,
        });

        updated.decisionHistory.unshift({
          id: `dec_shock_${Date.now()}`,
          timestamp: new Date().toISOString(),
          dayOccurred: updated.simulationDay,
          actionTitle: 'Journey B Shock: ₹1,500 Emergency Expense',
          decisionType: 'stress_tested',
          summary: 'Incurred unplanned ₹1,500 emergency obligation on Day ' + (updated.simulationDay + 2),
          lowestBalanceBefore: 1252,
          lowestBalanceAfter: -248,
          userDecision: 'approved',
          rationale: 'Demonstrates constraint breach and immediate recovery need.',
        });

        return updated;
      });
      setActiveTab('cashflow');
    } else if (journey === 'C') {
      // Journey C: Delayed Income
      setFinancialState((prev) => {
        const updated = structuredClone(prev);
        const income = updated.incomes.find((inc) => inc.id === 'inc_freelance_14');
        if (income) {
          income.actualDay = 24; // delayed from Day 14 to Day 24
          income.status = 'delayed';
        }

        updated.decisionHistory.unshift({
          id: `dec_delay_${Date.now()}`,
          timestamp: new Date().toISOString(),
          dayOccurred: updated.simulationDay,
          actionTitle: 'Journey C Shock: Client Retainer Delayed (+10 Days)',
          decisionType: 'stress_tested',
          summary: 'Freelance payment of ₹4,000 delayed from Day 14 to Day 24.',
          lowestBalanceBefore: 1252,
          lowestBalanceAfter: -800,
          userDecision: 'approved',
          rationale: 'Simulates cash freeze prior to bill due dates.',
        });

        return updated;
      });
      setActiveTab('cashflow');
    } else if (journey === 'D') {
      // Journey D: Direct Recovery Center Workflow
      setActiveTab('recovery');
    }
  };

  // If user explicitly toggles back to sign-in view
  if (!inDemoWorkspace && !isLoggedIn) {
    return (
      <LoginView
        onEnterDemo={() => setInDemoWorkspace(true)}
        onLoginSuccess={(email) => {
          setIsLoggedIn(true);
          setUserEmail(email);
          setInDemoWorkspace(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTestDecision={() => setShowDecisionModal(true)}
        onOpenAuthModal={() => setInDemoWorkspace(false)}
        onResetDemo={handleResetDemo}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
      />

      {/* Honest Fictional Demo Banner & Day Stepper */}
      <DemoBanner
        simulationDay={financialState.simulationDay}
        onSetSimulationDay={handleSetSimulationDay}
        onLaunchJourney={handleLaunchJourney}
        onReset={handleResetDemo}
      />

      {/* Primary Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewView
            state={financialState}
            metrics={metrics}
            forecast={baseForecast}
            previewOption={previewOption}
            previewForecast={previewForecast}
            onNavigateTab={setActiveTab}
            onLaunchJourney={handleLaunchJourney}
            onOpenTestDecision={() => setShowDecisionModal(true)}
            onSelectDay={handleSetSimulationDay}
          />
        )}

        {activeTab === 'cashflow' && (
          <CashflowView
            state={financialState}
            metrics={metrics}
            forecast={baseForecast}
            previewForecast={previewForecast}
            previewOption={previewOption}
            onSetSimulationDay={handleSetSimulationDay}
          />
        )}

        {activeTab === 'decision_lab' && (
          <DecisionLabView
            state={financialState}
            baseMetrics={metrics}
            baseForecast={baseForecast}
            onCommitDecision={handleCommitDecision}
            onPreviewOption={setPreviewOption}
            previewOption={previewOption}
          />
        )}

        {activeTab === 'recovery' && (
          <RecoveryCenterView
            state={financialState}
            metrics={metrics}
            forecast={activeForecast}
            onApplyAction={handleApplyRecovery}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityGoalsView
            state={financialState}
            onUpdateState={setFinancialState}
          />
        )}

        {activeTab === 'history' && (
          <EvidenceHistoryView state={financialState} />
        )}
      </main>

      {/* Test Decision & Scenario Launcher Modal */}
      <DecisionLauncherModal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        simulationDay={financialState.simulationDay}
        onNavigateToDecisionLab={({ title, amount, day }) => {
          setActiveTab('decision_lab');
        }}
        onApplyStressExpense={(amount, title) => {
          setFinancialState((prev) => {
            const updated = structuredClone(prev);
            updated.commitments.push({
              id: `com_stress_${Date.now()}`,
              dueDay: updated.simulationDay,
              title,
              amount,
              category: 'health',
              priority: 'essential',
              status: 'due',
              isRecurring: false,
              canDefer: false,
            });
            return updated;
          });
          setActiveTab('cashflow');
        }}
        onDelayIncome={(delayDays) => {
          setFinancialState((prev) => {
            const updated = structuredClone(prev);
            const inc = updated.incomes.find((i) => i.id === 'inc_freelance_14');
            if (inc) {
              inc.actualDay = 14 + delayDays;
              inc.status = 'delayed';
            }
            return updated;
          });
          setActiveTab('cashflow');
        }}
      />

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-6 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">RunwayOS</span>
            <span>·</span>
            <span>Educational Financial Operations Platform</span>
            <span>·</span>
            <span className="text-teal-400 font-mono">Tests: {testResults.passed} Passed / {testResults.failed} Failed</span>
          </div>
          <div>
            <span>Fictional demonstration data · No live banking integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
