/**
 * RunwayOS — Automated Verification Test Suite
 * Tests deterministic invariants, double-counting prevention,
 * scenario impacts, recovery ranking, and persisted-state validation.
 */

import {
  calculateCurrentCash,
  calculateCashMetrics,
  generateDailyForecast,
  generateRecoveryOptions,
  applyRecoveryAction,
} from '../engine/financeEngine';
import { isValidFinancialState } from '../engine/storage';
import { INITIAL_DEMO_STATE } from '../engine/sampleData';
import { DecisionOption, StressScenario } from '../types/finance';

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

  // 1. Opening cash calculation
  const currentCash = calculateCurrentCash(baseState);
  assert(currentCash === 9250, 'Opening settled cash is exactly ₹9,250');

  // 2. Unpaid obligations are not settled transactions
  assert(
    !baseState.transactions.some(t => t.title.includes('Rent')),
    'Unpaid commitment is not present as a settled transaction'
  );

  // 3. 30-day forecast timeline
  const forecast = generateDailyForecast(baseState);
  assert(forecast.length === 30, 'Forecast generates exactly 30 days');
  assert(forecast[0].openingBalance === 9250, 'Day 1 opening balance equals settled cash');

  // Forward forecasts must begin from current settled cash without replaying history.
  const dayFiveState = structuredClone(baseState);
  dayFiveState.simulationDay = 5;
  const dayFiveForecast = generateDailyForecast(dayFiveState);
  assert(dayFiveForecast[4].openingBalance === calculateCurrentCash(dayFiveState), 'Forecast starts from current cash on the simulation day');
  assert(dayFiveForecast[4].committedTotal >= 4500, 'Due commitment is applied on the current simulation day');
  assert(dayFiveForecast[5].openingBalance === dayFiveForecast[4].closingBalance, 'Forward balances roll consistently after current day');

  const dayFifteenState = structuredClone(baseState);
  dayFifteenState.simulationDay = 15;
  const dayFifteenForecast = generateDailyForecast(dayFifteenState);
  assert(dayFifteenForecast[13].incomeTotal === 0, 'Past expected income is not counted again after the simulation day');
  assert(dayFifteenForecast[14].openingBalance === calculateCurrentCash(dayFifteenState), 'Day 15 forecast begins from the settled current cash balance');

  // 4. Day 5 rent due date
  const day5 = forecast.find(f => f.day === 5);
  assert(day5 !== undefined && day5.committedTotal >= 4500, 'Day 5 reflects ₹4,500 PG rent commitment');

  // 5. Expected income timing
  const day14 = forecast.find(f => f.day === 14);
  assert(day14 !== undefined && day14.incomeTotal === 4000, 'Day 14 reflects ₹4,000 freelance inflow');

  // 6. Core cash metrics
  const metrics = calculateCashMetrics(baseState, forecast);
  assert(metrics.protectedReserve === 1000, 'Protected reserve floor is ₹1,000');
  assert(metrics.lowestProjectedBalance > 0, 'Baseline lowest projected balance remains positive');

  // 7. Simulation isolation
  const simulatedOption: DecisionOption = {
    id: 'test_buy', label: 'Expensive Equipment', description: 'High cost item',
    day: 3, amount: 3000,
  };
  const simForecast = generateDailyForecast(baseState, { simulatedOption });
  const simMetrics = calculateCashMetrics(baseState, simForecast);
  assert(simMetrics.lowestProjectedBalance < metrics.lowestProjectedBalance, 'Simulated purchase reduces lowest projected balance');
  assert(calculateCurrentCash(baseState) === 9250, 'Simulation leaves active base state unchanged');

  // 8. Unexpected expense changes the forecast but not the source state
  const stressScenario: StressScenario = {
    id: 'test_emergency', name: 'Emergency Repair', description: 'Bicycle repair',
    type: 'unexpected_expense', expenseAmount: 1500, expenseDay: 8,
  };
  const stressForecast = generateDailyForecast(baseState, { stressScenario });
  const stressMetrics = calculateCashMetrics(baseState, stressForecast);
  assert(stressMetrics.lowestProjectedBalance < metrics.lowestProjectedBalance, 'Emergency expense correctly stress-tests cashflow');
  assert(calculateCurrentCash(baseState) === 9250, 'Stress simulation does not mutate settled cash');

  // 9. Recovery options are generated and ranked
  const recoveryOptions = generateRecoveryOptions(baseState, stressForecast);
  assert(recoveryOptions.length > 0, 'Generates recovery options for a stressed forecast');
  assert(recoveryOptions[0].priorityRank <= recoveryOptions[recoveryOptions.length - 1].priorityRank, 'Recovery options are sorted by priority');

  // 10. Recovery action produces a traceable state transition
  const updatedState = applyRecoveryAction(baseState, recoveryOptions[0]);
  assert(updatedState.decisionHistory.length === baseState.decisionHistory.length + 1, 'Recovery action adds an audit entry');
  assert(baseState.decisionHistory.length === INITIAL_DEMO_STATE.decisionHistory.length, 'Recovery action leaves source history unchanged');

  // 11. Allocation reconciliation
  const alloc = metrics.allocation;
  const allocSum = alloc.protectedReserve + alloc.essentialCommitments + alloc.savingsGoals + alloc.flexibleDiscretionary;
  assert(allocSum === currentCash, `Allocation reconciles to current cash (₹${allocSum} === ₹${currentCash})`);

  // 12. Month-end consistency
  assert(typeof metrics.monthEndBalance === 'number' && metrics.monthEndBalance === forecast[29].closingBalance, 'Month-end metric equals Day 30 closing balance');

  // 13. Committed outflow consistency
  assert(metrics.totalCommittedOutflow > 0 && metrics.totalCommittedOutflow >= metrics.unpaidEssentialCommitments, 'Committed outflow includes essential obligations');

  // 14–17. Persisted-state validation checks nested records, not just top-level shape
  assert(isValidFinancialState(baseState), 'Accepts the complete valid demo state');
  const badTransactionState = structuredClone(baseState) as unknown as Record<string, any>;
  badTransactionState.transactions[0].amount = Number.NaN;
  assert(!isValidFinancialState(badTransactionState), 'Rejects non-finite nested transaction amounts');
  const badIncomeState = structuredClone(baseState) as unknown as Record<string, any>;
  badIncomeState.incomes[0].expectedDay = 31;
  assert(!isValidFinancialState(badIncomeState), 'Rejects income events outside the 30-day horizon');
  const badConstraintState = structuredClone(baseState) as unknown as Record<string, any>;
  badConstraintState.constraints.minimumReserve = -500;
  assert(!isValidFinancialState(badConstraintState), 'Rejects negative protected reserve constraints');
  const missingHistoryState = structuredClone(baseState) as unknown as Record<string, any>;
  missingHistoryState.decisionHistory = [null];
  assert(!isValidFinancialState(missingHistoryState), 'Rejects malformed nested audit history entries');

  return { passed, failed, results };
}
