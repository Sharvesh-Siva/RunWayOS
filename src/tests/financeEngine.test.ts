/**
 * RunwayOS — Automated Verification Test Suite
 * Tests deterministic invariants, double-counting prevention,
 * scenario impacts, and recovery action ranking.
 */

import {
  calculateCurrentCash,
  calculateCashMetrics,
  generateDailyForecast,
  generateRecoveryOptions,
  applyRecoveryAction,
} from '../engine/financeEngine';
import { INITIAL_DEMO_STATE } from '../engine/sampleData';
import { AppFinancialState, DecisionOption, StressScenario } from '../types/finance';

export function runAllTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`PASS: ${testName}`);
    } else {
      failed++;
      results.push(`FAIL: ${testName}`);
      console.error(`[Test Failed] ${testName}`);
    }
  }

  const baseState = structuredClone(INITIAL_DEMO_STATE);

  // Test 1: Opening cash calculation
  // Initial 10,000 - 450 (groceries) - 300 (metro) = 9,250
  const currentCash = calculateCurrentCash(baseState);
  assert(currentCash === 9250, 'Opening settled cash is exactly ₹9,250');

  // Test 2: Double-counting prevention
  // Unpaid commitments due on Day 5 (₹4,500 rent) must NOT be deducted from Day 1 current bank cash
  assert(
    !baseState.transactions.some(t => t.title.includes('Rent')),
    'Unpaid commitment is not present as a settled transaction'
  );

  // Test 3: 30-Day forecast timeline integrity
  const forecast = generateDailyForecast(baseState);
  assert(forecast.length === 30, 'Forecast generates exactly 30 days');
  assert(forecast[0].openingBalance === 9250, 'Day 1 opening balance equals settled cash');

  // Test 4: Day 5 rent deduction on due date
  const day5 = forecast.find(f => f.day === 5);
  assert(day5 !== undefined && day5.committedTotal >= 4500, 'Day 5 reflects ₹4,500 PG rent commitment');

  // Test 5: Day 14 freelance income reflection
  const day14 = forecast.find(f => f.day === 14);
  assert(day14 !== undefined && day14.incomeTotal === 4000, 'Day 14 reflects ₹4,000 freelance inflow');

  // Test 6: Metrics calculation
  const metrics = calculateCashMetrics(baseState, forecast);
  assert(metrics.protectedReserve === 1000, 'Protected reserve floor is ₹1,000');
  assert(metrics.lowestProjectedBalance > 0, 'Baseline lowest projected balance remains positive');

  // Test 7: Simulation isolation (does not mutate baseState)
  const simulatedOption: DecisionOption = {
    id: 'test_buy',
    label: 'Expensive Equipment',
    description: 'High cost item',
    day: 3,
    amount: 3000,
  };
  const simForecast = generateDailyForecast(baseState, { simulatedOption });
  const simMetrics = calculateCashMetrics(baseState, simForecast);

  assert(
    simMetrics.lowestProjectedBalance < metrics.lowestProjectedBalance,
    'Simulated purchase reduces lowest projected balance'
  );
  assert(
    calculateCurrentCash(baseState) === 9250,
    'Simulated purchase leaves active baseState strictly intact'
  );

  // Test 8: Stress scenario unexpected expense
  const stressScenario: StressScenario = {
    id: 'test_emergency',
    name: 'Emergency Repair',
    description: 'Bicycle repair',
    type: 'unexpected_expense',
    expenseAmount: 1500,
    expenseDay: 8,
  };
  const stressForecast = generateDailyForecast(baseState, { stressScenario });
  const stressMetrics = calculateCashMetrics(baseState, stressForecast);
  assert(
    stressMetrics.lowestProjectedBalance < metrics.lowestProjectedBalance,
    'Emergency expense correctly stress-tests the cashflow'
  );

  // Test 9: Recovery option generation
  // Under stress, recovery actions must be produced and ranked
  const recoveryOptions = generateRecoveryOptions(baseState, stressForecast);
  assert(recoveryOptions.length > 0, 'Generates recovery options when stress occurs');
  assert(recoveryOptions[0].priorityRank <= recoveryOptions[recoveryOptions.length - 1].priorityRank, 'Recovery options are sorted by priority');

  // Test 10: Apply recovery action state transition
  const firstAction = recoveryOptions[0];
  const updatedState = applyRecoveryAction(baseState, firstAction);
  assert(
    updatedState.decisionHistory.length === baseState.decisionHistory.length + 1,
    'Applying recovery action logs a new audit entry in decision history'
  );

  // Test 11: Reconciled non-overlapping funds allocation
  const alloc = metrics.allocation;
  const allocSum = alloc.protectedReserve + alloc.essentialCommitments + alloc.savingsGoals + alloc.flexibleDiscretionary;
  assert(
    allocSum === currentCash,
    `Allocation partitions reconcile 100% to current cash (₹${allocSum} === ₹${currentCash})`
  );

  // Test 12: Month-end balance and summary card metrics
  assert(
    typeof metrics.monthEndBalance === 'number' && metrics.monthEndBalance === forecast[29].closingBalance,
    'Month-end balance exactly equals Day 30 forecast closing balance'
  );

  // Test 13: Total committed outflow
  assert(
    metrics.totalCommittedOutflow > 0 && metrics.totalCommittedOutflow >= metrics.unpaidEssentialCommitments,
    'Total committed outflow encompasses both essential and flexible future obligations'
  );

  return { passed, failed, results };
}
