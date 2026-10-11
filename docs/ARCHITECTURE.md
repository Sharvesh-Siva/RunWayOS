# RunwayOS Architecture Notes

## Design intent

RunwayOS is a client-side demonstration, not a banking system. The financial engine is deterministic and framework-independent: React components present state and collect decisions, while pure calculation functions produce forecasts and metrics. Browser storage is untrusted input and is validated at the boundary.

## Dependency direction

```text
React application shell (src/App.tsx)
  ├── Workspace views and reusable charts
  ├── Financial domain types (src/types/finance.ts)
  ├── Finance engine (src/engine/financeEngine.ts)
  └── Storage boundary (src/engine/storage.ts)
        └── validates unknown JSON before returning domain state

Tests (src/tests)
  └── exercise the domain engine and storage validation without rendering UI
```

- **UI layer:** gathers inputs, displays forecasts, and asks for approval. It should not duplicate financial arithmetic.
- **Domain layer:** `financeEngine.ts` calculates settled cash, day-by-day forecasts, metrics, stress scenarios, and recovery transitions.
- **Persistence boundary:** `storage.ts` parses local storage as `unknown`, validates nested records and numeric constraints, and falls back to the fictional initial scenario if invalid.
- **Tests:** `npm test` runs deterministic invariants separately from application startup.
- **CI:** `.github/workflows/verify.yml` runs tests, TypeScript validation, and a production build for pushes and pull requests.

## Important calculation invariants

1. Settled transactions and received income affect current cash once.
2. A forecast starts at the current settled cash balance on the selected simulation day; it must not replay earlier activity into future balances.
3. Unreceived income remains an assumption and is never described as guaranteed funds.
4. Scenario previews are calculated separately and do not mutate the active state.
5. A recovery proposal must alter the relevant commitment or constraint when approved; its audit record compares the forecast before and after.
6. User-provided or persisted values are not trusted until validated.
7. The displayed reserve is a planning constraint, not a separate bank account or a guarantee.

## Current limitations and next improvements

- This prototype uses fictional INR data and browser local storage; it has no real bank integration or production authentication.
- Historical chart rows before the current simulation day are shown as neutral placeholders based on current settled cash. They are not a reconstructed historical ledger.
- CI currently uses `npm install` because the repository does not track a lockfile. For stronger reproducibility, review and commit `package-lock.json`, then change CI to `npm ci`.
- Automated checks do not replace keyboard, screen-reader, mobile-layout, and real-browser smoke testing.
- Before production use, add schema version migrations, explicit persistence error feedback, component-level accessibility tests, and reviewed financial-domain edge-case coverage.
