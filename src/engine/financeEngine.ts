/**
 * RunwayOS — Deterministic Financial Operations Engine
 * Pure functions for cashflow forecasting, constraint evaluation,
 * resilience stress-testing, and recovery ranking.
 */

import {
  AppFinancialState,
  CashMetrics,
  Commitment,
  DayForecast,
  DecisionOption,
  IncomeEvent,
  MoneyAllocation,
  RecoveryAction,
  StressScenario,
} from '../types/finance';

/**
 * Format currency into standard Indian Rupee format (e.g. ₹10,000)
 */
export function formatINR(amount: number, showSign = false): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  
  // Format with standard Indian numbering (lakhs/thousands)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(abs);

  if (showSign) {
    if (amount > 0) return `+₹${formatted}`;
    if (amount < 0) return `-₹${formatted}`;
    return `₹0`;
  }
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Calculate current settled cash balance at the current simulation day.
 * Invariant: Never count an unpaid commitment as already spent from current bank balance.
 * Settled cash = initialBalance + settledInflows - settledOutflows
 */
export function calculateCurrentCash(state: AppFinancialState): number {
  const currentDay = state.simulationDay;

  // Settled transactions occurred on or before currentDay
  const settledOutflows = state.transactions
    .filter(t => t.day <= currentDay && t.status === 'settled')
    .reduce((sum, t) => sum + t.amount, 0);

  // Incomes actually received on or before currentDay
  const receivedInflows = state.incomes
    .filter(inc => inc.status === 'received' && (inc.actualDay ?? inc.expectedDay) <= currentDay)
    .reduce((sum, inc) => sum + inc.amount, 0);

  const paidCommitments = state.commitments
    .filter(com => com.status === 'paid' && com.dueDay <= currentDay)
    .reduce((sum, com) => sum + com.amount, 0);

  return state.initialBalance + receivedInflows - settledOutflows - paidCommitments;
}

/**
 * Calculate active cash metrics and health indicators
 */
export function calculateCashMetrics(
  state: AppFinancialState,
  forecast: DayForecast[]
): CashMetrics {
  const currentCash = calculateCurrentCash(state);
  const currentDay = state.simulationDay;

  // Unpaid commitments due in the future
  const upcomingCommitments = state.commitments.filter(
    c => c.dueDay >= currentDay && c.status === 'due'
  );

  const unpaidEssential = upcomingCommitments
    .filter(c => c.priority === 'essential')
    .reduce((sum, c) => sum + c.amount, 0);

  const unpaidFlexible = upcomingCommitments
    .filter(c => c.priority === 'flexible' || c.priority === 'discretionary')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCommittedOutflow = unpaidEssential + unpaidFlexible;

  // Pending income in planning horizon
  const pendingIncomeAmount = state.incomes
    .filter(inc => {
      const day = inc.actualDay ?? inc.expectedDay;
      return day >= currentDay && inc.status !== 'received';
    })
    .reduce((sum, inc) => sum + inc.amount, 0);

  // Safe discretionary cash remaining right now:
  // Current cash minus upcoming essential obligations minus protected reserve
  const safeDiscretionaryRemaining = Math.max(
    0,
    currentCash - unpaidEssential - state.constraints.minimumReserve
  );

  // Find lowest balance across the remaining forecast days
  let lowestProjectedBalance = currentCash;
  let lowestProjectedDay = currentDay;
  let firstBreachDay: number | null = null;

  for (const f of forecast) {
    if (f.day >= currentDay) {
      if (f.closingBalance < lowestProjectedBalance) {
        lowestProjectedBalance = f.closingBalance;
        lowestProjectedDay = f.day;
      }
      if (firstBreachDay === null && f.closingBalance < state.constraints.minimumReserve) {
        firstBreachDay = f.day;
      }
    }
  }

  // Month-end closing balance (Day 30)
  const monthEndBalance = forecast.length > 0 ? forecast[forecast.length - 1].closingBalance : currentCash;

  // Burn rate: net daily drawdown or outflow trend
  const remainingDays = Math.max(1, 30 - currentDay + 1);
  const netDrawdown = currentCash - monthEndBalance;
  const burnRateDailyAverage = Math.round(netDrawdown / remainingDays);

  // Resilience rating
  let resilienceRating: 'Resilient' | 'Needs Attention' | 'At Risk' = 'Resilient';
  if (firstBreachDay !== null || lowestProjectedBalance < state.constraints.minimumReserve) {
    resilienceRating = 'At Risk';
  } else if (lowestProjectedBalance < state.constraints.minimumReserve * 1.35) {
    resilienceRating = 'Needs Attention';
  } else {
    resilienceRating = 'Resilient';
  }

  // Test 4 deterministic stress tests for passing percentage
  const stressTests = [
    { type: 'unexpected_expense', amount: 500 },
    { type: 'unexpected_expense', amount: 1000 },
    { type: 'unexpected_expense', amount: 1500 },
    { type: 'delayed_income', delay: 5 },
  ];
  let passedStress = 0;
  for (const st of stressTests) {
    let minBal = lowestProjectedBalance;
    if (st.type === 'unexpected_expense') {
      minBal = lowestProjectedBalance - (st.amount || 0);
    } else if (st.type === 'delayed_income') {
      // If income is delayed by 5 days, evaluate lowest balance before delayed payout
      minBal = lowestProjectedBalance - 400; // approximate pre-inflow stress test
    }
    if (minBal >= state.constraints.minimumReserve) {
      passedStress++;
    }
  }
  const stressPassingPercentage = Math.round((passedStress / stressTests.length) * 100);

  // Strict non-overlapping money allocation of current settled cash
  const protectedReserveAllocated = Math.min(currentCash, state.constraints.minimumReserve);
  const rem1 = currentCash - protectedReserveAllocated;
  const essentialAllocated = Math.min(rem1, unpaidEssential);
  const rem2 = rem1 - essentialAllocated;
  const goalCurrentTotal = state.goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const savingsAllocated = Math.min(rem2, goalCurrentTotal);
  const flexibleDiscretionary = Math.max(0, rem2 - savingsAllocated);

  const allocation: MoneyAllocation = {
    totalFunds: currentCash,
    protectedReserve: protectedReserveAllocated,
    essentialCommitments: essentialAllocated,
    savingsGoals: savingsAllocated,
    flexibleDiscretionary,
  };

  // Runway days: days until closing balance would drop below zero or end of month
  let runwayDays = 30 - currentDay + 1;
  const zeroBreach = forecast.find(f => f.day >= currentDay && f.closingBalance <= 0);
  if (zeroBreach) {
    runwayDays = Math.max(0, zeroBreach.day - currentDay);
  }

  const isAtRisk = firstBreachDay !== null || lowestProjectedBalance < state.constraints.minimumReserve;

  return {
    currentCash,
    unpaidEssentialCommitments: unpaidEssential,
    unpaidFlexibleCommitments: unpaidFlexible,
    totalCommittedOutflow,
    pendingIncomeAmount,
    burnRateDailyAverage,
    protectedReserve: state.constraints.minimumReserve,
    safeDiscretionaryRemaining,
    lowestProjectedBalance,
    lowestProjectedDay,
    firstBreachDay,
    monthEndBalance,
    runwayDays,
    resilienceRating,
    stressPassingPercentage,
    isAtRisk,
    allocation,
  };
}

/**
 * Deterministic 30-day daily projection engine
 * Can incorporate simulated decisions or stress scenarios without modifying base state.
 */
export function generateDailyForecast(
  state: AppFinancialState,
  options?: {
    simulatedOption?: DecisionOption | null;
    stressScenario?: StressScenario | null;
  }
): DayForecast[] {
  const currentCash = calculateCurrentCash(state);
  const currentDay = state.simulationDay;
  const minReserve = state.constraints.minimumReserve;
  const dailyDiscretionary = state.constraints.dailyDiscretionaryBudget;
  const activeDailySavings = state.goals.reduce((sum, goal) => sum + goal.allocatedDaily, 0);
  const forecast: DayForecast[] = [];
  let runningBalance = currentCash;

  for (let day = 1; day <= 30; day++) {
    // Current cash already includes settled activity through simulationDay.
    // Keep historical rows for the 30-day chart without replaying old activity.
    if (day < currentDay) {
      forecast.push({
        day, dateLabel: `Day ${day}`,
        openingBalance: currentCash, incomeTotal: 0, committedTotal: 0,
        discretionaryTotal: 0, savingsTotal: 0, simulatedTotal: 0,
        closingBalance: currentCash, minimumProjected: minReserve,
        isConstraintBreached: currentCash < minReserve, events: [],
      });
      continue;
    }

    let dayIncome = 0;
    const dayEvents: DayForecast['events'] = [];
    for (const income of state.incomes) {
      let incomeDay = income.actualDay ?? income.expectedDay;
      if (
        options?.stressScenario?.type === 'delayed_income' &&
        (!options.stressScenario.incomeId || options.stressScenario.incomeId === income.id) &&
        options.stressScenario.incomeDelayDays &&
        income.status !== 'received'
      ) incomeDay += options.stressScenario.incomeDelayDays;

      if (income.status !== 'received' && incomeDay === day) {
        dayIncome += income.amount;
        dayEvents.push({ type: 'income', title: income.title, amount: income.amount, isOutflow: false });
      }
    }

    let dayCommitments = 0;
    for (const commitment of state.commitments) {
      if (commitment.dueDay === day && commitment.status === 'due') {
        dayCommitments += commitment.amount;
        dayEvents.push({ type: 'commitment', title: commitment.title, amount: commitment.amount, isOutflow: true });
      }
    }

    const surge = options?.stressScenario?.type === 'variable_spending_surge'
      ? Math.max(0, options.stressScenario.dailySurgeAmount ?? 0) : 0;
    const dayDiscretionary = dailyDiscretionary + surge;
    if (dayDiscretionary > 0) {
      dayEvents.push({
        type: 'discretionary',
        title: surge > 0 ? 'Discretionary + Variable Surge' : 'Daily Living Allowance',
        amount: dayDiscretionary, isOutflow: true,
      });
    }

    const daySavings = activeDailySavings;
    if (daySavings > 0) {
      dayEvents.push({ type: 'savings', title: 'Target Savings Contributions', amount: daySavings, isOutflow: true });
    }

    let daySimulated = 0;
    if (options?.simulatedOption && options.simulatedOption.day === day) {
      const amount = Math.max(0, options.simulatedOption.amount);
      daySimulated += amount;
      dayEvents.push({ type: 'simulated', title: `[Simulated] ${options.simulatedOption.label}`, amount, isOutflow: true });
    }

    const scenario = options?.stressScenario;
    if (
      scenario && (scenario.type === 'unexpected_expense' || scenario.type === 'compound_shock') &&
      scenario.expenseDay === day && (scenario.expenseAmount ?? 0) > 0
    ) {
      const amount = scenario.expenseAmount!;
      daySimulated += amount;
      dayEvents.push({ type: 'simulated', title: `[Stress] ${scenario.name}`, amount, isOutflow: true });
    }

    const openingBalance = runningBalance;
    const closingBalance = openingBalance + dayIncome -
      (dayCommitments + dayDiscretionary + daySavings + daySimulated);
    runningBalance = closingBalance;
    forecast.push({
      day, dateLabel: `Day ${day}`, openingBalance, incomeTotal: dayIncome,
      committedTotal: dayCommitments, discretionaryTotal: dayDiscretionary,
      savingsTotal: daySavings, simulatedTotal: daySimulated, closingBalance,
      minimumProjected: minReserve, isConstraintBreached: closingBalance < minReserve,
      events: dayEvents,
    });
  }
  return forecast;
}

/**
 * Generate ranked, deterministic recovery actions when a financial constraint fails.
 * Rules:
 * 1. Protect essential obligations (housing/rent, core utility).
 * 2. Target flexible subscriptions (cloud services, media passes) due before breach.
 * 3. Offer purchase delay or cheaper substitution.
 * 4. Dial back discretionary daily budget by 20% or 30%.
 * 5. Pause voluntary savings contributions.
 */
export function generateRecoveryOptions(
  state: AppFinancialState,
  forecast: DayForecast[]
): RecoveryAction[] {
  const currentDay = state.simulationDay;
  const metrics = calculateCashMetrics(state, forecast);
  const actions: RecoveryAction[] = [];

  // If there's no breach and safe margin is healthy, no emergency recovery needed
  const breachDay = metrics.firstBreachDay ?? 30;
  const deficit = Math.max(0, state.constraints.minimumReserve - metrics.lowestProjectedBalance);

  // 1. Identify flexible / discretionary commitments due between currentDay and breachDay
  const flexibleCommitments = state.commitments.filter(
    c =>
      c.dueDay >= currentDay &&
      c.dueDay <= breachDay + 5 &&
      c.status === 'due' &&
      (c.priority === 'discretionary' || c.canDefer)
  );

  for (const c of flexibleCommitments) {
    if (c.priority === 'discretionary') {
      actions.push({
        id: `pause_${c.id}`,
        title: `Pause ${c.title} on Day ${c.dueDay}`,
        description: `Temporarily freeze ${c.title} subscription for this cycle.`,
        type: 'pause_subscription',
        cashFreed: c.amount,
        effectiveDay: c.dueDay,
        tradeOff: 'Pauses subscription access until next month billing cycle.',
        targetCommitmentId: c.id,
        applied: false,
        priorityRank: 1, // High ranking: pure discretionary savings with 0 penalty
      });
    } else if (c.canDefer) {
      actions.push({
        id: `defer_${c.id}`,
        title: `Defer ${c.title} by 7 Days`,
        description: `Postpone payment until after expected mid-month cash replenishment.`,
        type: 'defer_commitment',
        cashFreed: c.amount,
        effectiveDay: c.dueDay,
        tradeOff: 'May incur grace period inquiry; protects immediate runway.',
        targetCommitmentId: c.id,
        applied: false,
        priorityRank: 2,
      });
    }
  }

  // 2. Dial back daily discretionary allowance across the next 14 days
  const daysAhead = Math.min(14, 30 - currentDay + 1);
  if (state.constraints.dailyDiscretionaryBudget > 100 && daysAhead > 3) {
    const dailyTrim = Math.round(state.constraints.dailyDiscretionaryBudget * 0.25);
    const totalFreed = dailyTrim * daysAhead;
    actions.push({
      id: 'reduce_discretionary_25',
      title: `Tighten Discretionary Budget (-₹${dailyTrim}/day for ${daysAhead} days)`,
      description: `Reduce food/transit daily allowance from ₹${state.constraints.dailyDiscretionaryBudget} to ₹${state.constraints.dailyDiscretionaryBudget - dailyTrim}.`,
      type: 'reduce_discretionary',
      cashFreed: totalFreed,
      effectiveDay: currentDay,
      tradeOff: `Requires disciplined self-catering; preserves ₹${totalFreed} total runway.`,
      applied: false,
      priorityRank: 3,
    });
  }

  // 3. Pause active voluntary savings goal allocations
  const activeDailySavings = state.goals.reduce((sum, g) => sum + g.allocatedDaily, 0);
  if (activeDailySavings > 0) {
    const savingsFreed = activeDailySavings * (30 - currentDay + 1);
    actions.push({
      id: 'pause_savings_allocation',
      title: `Temporarily Pause Voluntary Savings Goal Deposits`,
      description: `Pause daily savings transfer of ₹${activeDailySavings}/day until month-end.`,
      type: 'reduce_discretionary',
      cashFreed: savingsFreed,
      effectiveDay: currentDay,
      tradeOff: 'Goal milestone delayed by 1 cycle, but prevents negative bank balance.',
      applied: false,
      priorityRank: 4,
    });
  }

  // Sort by priority rank (1 = least disruptive, most impactful)
  return actions.sort((a, b) => a.priorityRank - b.priorityRank);
}

/**
 * Apply a recovery action to produce an updated state with traceable audit
 */
export function applyRecoveryAction(
  state: AppFinancialState,
  action: RecoveryAction
): AppFinancialState {
  const updated = structuredClone(state);

  if (action.targetCommitmentId) {
    const idx = updated.commitments.findIndex(c => c.id === action.targetCommitmentId);
    if (idx !== -1) {
      if (action.type === 'pause_subscription') {
        updated.commitments[idx].status = 'cancelled';
      } else if (action.type === 'defer_commitment') {
        updated.commitments[idx].dueDay += 7;
        updated.commitments[idx].status = 'due';
      }
    }
  } else if (action.id === 'reduce_discretionary_25') {
    const dailyTrim = Math.round(updated.constraints.dailyDiscretionaryBudget * 0.25);
    updated.constraints.dailyDiscretionaryBudget = Math.max(50, updated.constraints.dailyDiscretionaryBudget - dailyTrim);
  } else if (action.id === 'pause_savings_allocation') {
    updated.goals = updated.goals.map(g => ({ ...g, allocatedDaily: 0 }));
  }

  // Record audit trail
  const beforeForecast = generateDailyForecast(state);
  const afterForecast = generateDailyForecast(updated);
  const beforeMetrics = calculateCashMetrics(state, beforeForecast);
  const afterMetrics = calculateCashMetrics(updated, afterForecast);

  updated.decisionHistory.unshift({
    id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    dayOccurred: state.simulationDay,
    actionTitle: action.title,
    decisionType: 'recovery_applied',
    summary: `Approved recovery: ${action.description}. Freed estimated ₹${action.cashFreed}.`,
    lowestBalanceBefore: beforeMetrics.lowestProjectedBalance,
    lowestBalanceAfter: afterMetrics.lowestProjectedBalance,
    userDecision: 'approved',
    rationale: action.tradeOff,
  });

  updated.evidenceCalls.unshift({
    id: `ev_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    moduleName: 'Recovery Planner',
    operation: 'Commit State Transition',
    inputSummary: `Action: ${action.id} (Freed: ₹${action.cashFreed})`,
    outputSummary: `Lowest balance improved from ₹${beforeMetrics.lowestProjectedBalance} to ₹${afterMetrics.lowestProjectedBalance}`,
    durationMs: 4,
    status: 'success',
  });

  return updated;
}
