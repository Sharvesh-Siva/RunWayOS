# RunwayOS

**Make your money last. Keep your options open.**

RunwayOS is a personal financial operations platform for students, young adults, and early-career people managing a limited budget. Instead of only recording past spending, it helps users understand their next 30 days, identify potential cash-flow pressure, compare choices, and review the effect of a decision before changing the active plan.

> **Demo notice:** The current workspace uses fictional INR data. It is an educational prototype, not a bank-connected service or a source of regulated financial advice.

## What it helps users do

- **Understand cash flow:** Review a day-by-day projection of opening funds, spending, commitments, and expected income.
- **Spot risks early:** See when the projected balance may fall below the protected reserve.
- **Evaluate a decision:** Compare a purchase now, a lower-cost alternative, or delaying the purchase.
- **Explore recovery options:** Review possible responses to a shortfall or a delayed payment.
- **Track goals and decisions:** Keep the plan, decision history, and calculation evidence together.
- **Learn through scenarios:** Trigger a purchase decision, unexpected expense, delayed income, or recovery workflow using the guided demo controls.

## How the workflow fits together

1. **Read the financial state** — load the demo ledger, commitments, income events, goals, and constraints.
2. **Forecast** — calculate the daily projected balance using deterministic financial rules.
3. **Detect** — compare the forecast with the configured reserve and other constraints.
4. **Simulate** — calculate a proposed alternative separately from the active plan.
5. **Review and approve** — the user chooses whether a proposed change should be committed.
6. **Record and recalculate** — update the demo plan and retain a decision/evidence trail.

Financial arithmetic is handled by the TypeScript finance engine. AI-generated text is not required for the core calculations. Forecasts are estimates based on the assumptions and fictional records currently in the workspace.

## Main workspace sections

| Section | Purpose |
| --- | --- |
| **Overview** | Quick financial summary, 30-day forecast, allocation, goal progress, current status, and product explainer |
| **Cashflow** | Inspect the projected timeline and upcoming commitments |
| **Decision Lab** | Compare alternatives before committing a change |
| **Recovery Center** | Explore possible actions when the plan is under pressure |
| **Activity & Goals** | Review commitments, activity, and savings goals |
| **Evidence Trace** | Inspect decision history and calculation/module events |

## Tech stack

- React 19 and TypeScript
- Vite
- Tailwind CSS 4
- Lucide icons
- Deterministic TypeScript finance engine
- Lightweight browser storage for the demo workspace

## Run locally

Requirements: Node.js compatible with the installed Vite version and npm.

```bash
npm install
npm run dev
```

To validate the project:

```bash
npm test
npm run lint
npm run build
```

The development server is configured for port 3000. Use the URL printed by Vite in your terminal.

## Project map

```text
src/
  App.tsx                    Application shell and workflow orchestration
  components/
    auth/                    Demo entry and sign-in presentation
    charts/                  Forecast, allocation, scenario, and goal visuals
    layout/                  Navigation and demo controls
    modals/                  Decision and breakdown dialogs
    overview/                Summary cards
    views/                   Overview and functional workspace sections
  engine/
    financeEngine.ts         Deterministic calculations and forecasts
    sampleData.ts            Clearly fictional initial scenario
    storage.ts               Demo-state persistence and reset
  tests/
    financeEngine.test.ts    Finance-engine invariant checks
  types/
    finance.ts               Shared financial domain types
docs/
  PROJECT_GUIDE.md           Product explanation, workflow, and limitations
```

## Transparency and safety

- Do not enter real banking credentials or sensitive account information into the demo.
- The current prototype does not connect to a bank, execute transfers, or verify income.
- A forecast can change when assumptions, timing, or sample records change; it is not a guarantee.
- Decision previews should be reviewed before a user commits changes.
- Browser storage is for demo continuity only and is not an authentication or secure financial-data system.

## Project status

RunwayOS is a prototype intended to demonstrate proactive cash-flow planning, deterministic scenario comparison, user-approved plan changes, and explainable decision history. Validate the build and interact with the demo before relying on any output.
