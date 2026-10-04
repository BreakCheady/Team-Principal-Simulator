# Architecture

## Core rule

The simulation engine must remain framework-independent.

```text
Browser UI (Next.js / React)
        ↓
Validated source game state
        ↓
TypeScript simulation engine
        ↓
Derived political state
        ↓
UI + save boundary
```

## Source state

Persisted or saveable data:

- characters
- relationships
- goals
- leverage
- precedents
- conflicts
- contracts, including paid salary and triggered bonuses
- finance settings, settlement cursor and transaction history

## Derived state

Recalculate from rules where practical:

- contextual power
- projected power
- faction strength
- success chance
- political cost
- escalation (always derived; never persisted on Conflict)
- cash balance, payroll headroom, outstanding commitments and liquidity forecast

Supabase will be introduced after the local decision → simulation → consequence loop is stable.

## v0.6 career integration

The playable Team HQ now runs a continuing career. See [career.md](career.md) for
transfers, independent actors, contractual consent, simulated races, development,
board objectives and version-8 migration. Authored performance snapshots remain
available to scenario tests; career mode uses only results from the race simulator.
Contracts and finance rounds continue across the 24-race season boundary.

## v0.7 world careers

New games now begin in preseason with series/team selection and a complete calendar
from race 1. The large world pool, series economies, actual team rosters and version-9
saves supersede the default nine-race opening described for v0.6 above. Legacy careers
retain their original progress. See [motorsport-world.md](motorsport-world.md) for
current world formats, recruitment, season lengths and the management abstractions.

## v0.8 race weekends

The current race model replaces the earlier one-score result formula with saved
practice/qualifying/grid/race phases, per-car strategy, measured time and series
sporting profiles. Crew employment, finance and political consequences remain
connected. See [racing.md](racing.md) for controls, official sources, save version 10
and the explicitly modeled rule scope.


## UI production boundary

Feature-heavy HQ screens must delegate domain workspaces to focused components instead of
growing the season shell indefinitely. `RoundEventsPanel` owns round navigation, persistence
and cross-workspace orchestration; domain panels such as contracts and finance own their
presentation and derived view calculations. Simulation mutations remain in `src/game`.

Production CI runs lint, an explicit TypeScript check, tests and the Next.js production build.
The app-level error boundary provides a recoverable failure screen without replacing or
silently mutating the user's local save.
