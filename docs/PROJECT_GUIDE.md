# RunwayOS — Project Guide

## 1. Project overview

RunwayOS is a personal financial operations prototype built around one question: **“Can my current plan get me through the next 30 days, and what can I change if it cannot?”**

Traditional expense trackers are often retrospective. RunwayOS emphasizes the next decision: dated obligations, uncertain income timing, protected reserves, and the consequences of possible choices.

**Intended users:** students, young adults, and early-career people working with limited funds.

**Current prototype boundary:** fictional INR demo records, a 30-day horizon, client-side state, and no live banking integration.

## 2. Core user journey

1. Open the Overview and inspect the summary metrics.
2. Read the cash-flow projection and identify any date where the reserve may be breached.
3. Open Decision Lab or launch a guided scenario.
4. Compare alternatives in preview mode.
5. Review the impact and explicitly approve or reject the change.
6. Inspect the updated plan and evidence history.
7. Reset the demo to return to the original fictional scenario.

## 3. Product sections

### Overview
Explains the current position through summary metrics, the cash-flow chart, money allocation, goal progress, operational status, and guided scenarios. The explanatory panel describes the system's method and the limitations of its forecast.

### Cashflow
Shows the projected daily balance and timing of inflows and outflows. Users should interpret it as a model output based on the currently listed records—not as a live account balance.

### Decision Lab
Compares a proposed purchase or timing change against the current plan. A preview should remain isolated from the active state until the user approves it.

### Recovery Center
Presents candidate actions for dealing with a potential constraint breach. Recommendations are decision support; users remain responsible for reviewing the trade-offs.

### Activity & Goals
Provides context about scheduled commitments, spending activity, and savings goals.

### Evidence Trace
Makes decisions and calculation/module events inspectable, supporting a clearer explanation of how the demo reached a result.

## 4. Calculation principles

- Financial arithmetic and forecast generation belong in the deterministic TypeScript finance engine.
- The same source of truth should feed summary cards, charts, scenario comparisons, and decision results.
- A preview must not mutate the active financial plan.
- Committed changes should trigger a fresh forecast and remain visible in the decision history.
- The protected reserve is a planning constraint, not money held in a real separate account.
- Expected income is an assumption with timing and confidence; it is not guaranteed cash.
- Values shown in this prototype are fictional and should be labelled accordingly.

## 5. Demo scenarios

- **Purchase decision:** compare a full-price purchase, a cheaper alternative, or waiting.
- **Unexpected expense:** introduce an unplanned cost and inspect its effect on the forecast.
- **Delayed income:** move an expected payment later to demonstrate timing risk.
- **Recovery workflow:** navigate to possible actions after a risk is identified.

Scenarios are illustrative, not claims about a real person's finances. Reset the demo between walkthroughs to avoid carrying a prior scenario into the next one.

## 6. Technical structure

- `src/App.tsx` coordinates the main workspace, navigation, state transitions, and scenario handlers.
- `src/types/finance.ts` defines the shared financial domain model.
- `src/engine/financeEngine.ts` contains deterministic metrics, projections, and related financial calculations.
- `src/engine/sampleData.ts` defines the initial fictional demo ledger.
- `src/engine/storage.ts` handles browser-side demo persistence and reset.
- `src/components/views/` contains the major workspace screens.
- `src/components/charts/` contains graphical representations of the model outputs.
- `src/tests/financeEngine.test.ts` contains invariant checks invoked by the app.
- `src/components/views/OverviewView.tsx` includes the user-facing product explanation.

## 7. Data, security, and limitations

- No live bank data, payment rails, or verified income feeds are connected.
- Local browser storage is not a secure vault and should contain demo data only.
- The prototype's sign-in presentation must not be interpreted as production-grade identity verification.
- Never commit API keys, access tokens, real financial statements, or personal account details.
- Any future server or AI integration should validate inputs, keep secrets server-side, apply least-privilege access, and avoid allowing generated text to directly mutate the financial ledger.
- Financial recommendations should show assumptions and trade-offs and require explicit user approval.
- This prototype is educational and does not replace professional financial advice.

## 8. Validation

Run the following commands before submitting changes:

```bash
npm run lint
npm run build
```

When changing financial calculations, add or update invariant tests for boundary conditions, negative balances, delayed inflows, reserve breaches, and preview-versus-commit behavior. Also check keyboard access, focus visibility, responsive layouts, readable chart labels, and text alternatives for important graphical data.
