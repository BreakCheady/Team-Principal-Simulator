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
