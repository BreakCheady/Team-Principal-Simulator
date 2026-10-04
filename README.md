# Team Principal Simulator

A browser-based motorsport management game about **people, power and paddock politics**.

## Current milestone

**v0.7 – Motorsport World and Full Season Start**

Start a new career in preseason, select one of nine series and any of 106 fictional
teams, then begin at race 1 with fresh contracts, finances and championship tables.

**F1, F2, F3, F4, GT3, GT4, LMP1, IndyCar and Rally** have their own fields, calendars,
team capabilities and game budgets. The world contains **666 drivers and 748 staff**,
including employed professionals and free agents with age, nationality, skill,
potential, career traits and salary demands.

Recruit through a searchable, filtered and paginated market. Transfers change real
world rosters. Follow all nine championship tables, scout team personnel and continue
into further seasons with aging, development and recorded champions.

Contracts, autonomous political actors, finance, racing, development and board reviews
remain connected. New careers start from the beginning; older v6–v8 saves preserve
their progress when migrated to v9.

This is a fictional, sport-inspired management simulation. LMP1 is a historical
heritage championship; endurance crews and rally stages are abstracted. See
[motorsport world](docs/motorsport-world.md) for series formats and scope,
[career gameplay](docs/career.md), [contracts](docs/contracts.md) and
[finances](docs/finances.md).

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
