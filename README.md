# Team Principal Simulator

A browser-based motorsport management game about **people, power and paddock politics**.

## Current milestone

**v0.6 – Persistent Team Principal Career**

Lead Vanguard Racing through the introductory conflicts, then manage a continuing
career with simulated races, transfers, development and board objectives.

- Driver and staff market with real signings, fees, salary demands and changing lineups.
- Rival approaches, departures, release rights and consensual mutual options.
- Autonomous actors build alliances, demand authority and exercise character-held rights.
- Seeded races derive results from drivers, staff, car, reliability and strategy.
- Development projects spend cash, take time, carry risk and shift political influence.
- Complete 24-race seasons, receive prize money and face board reviews or dismissal.

Contracts and finances remain connected: salary, guarantees, options, bonuses, fees,
project spending and prize income share a persistent ledger. Renewals and signings
must fit cash, payroll and commitment budgets. Player choices affect future races,
politics and the next season.

The opening career starts at R15, with championship counters initialized for the
remaining nine races. Later seasons simulate every race. The candidate market and
rival field are deliberately small fictional models. Save/load is local; v6/v7 saves
migrate to v8 without rebilling recorded history.

See [career gameplay](docs/career.md), [contracts](docs/contracts.md) and
[team finances](docs/finances.md) for the rules and current scope.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zod
- Vitest
- GitHub Actions

Supabase is intentionally deferred until the local gameplay loop is stable.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs the same checks on feature branches and pull requests.

## Architecture rule

Persist **source state** (characters, relationships, goals, leverage, precedents and conflicts) and calculate **derived state** (contextual power, faction strength, success chance, political cost and escalation) from the simulation rules.
