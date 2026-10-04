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
