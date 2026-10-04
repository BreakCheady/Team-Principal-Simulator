# Team Principal Simulator

A browser-based motorsport management game about **people, power and paddock politics**.

## Current milestone

**v0.8 – Race Weekends, Strategy and Series Sporting Profiles**

Start in preseason, choose one of nine series and 106 fictional teams, then manage
practice, setup, qualifying and live racing. Plan tyres, fuel, repairs and driver
changes separately for every car. Run lap by lap, pause for strategy decisions or
simulate the rest of the weekend.

The 666-driver / 748-staff world now supplies real endurance partners and rally
co-drivers with employment and salary contracts. Series profiles cover F1 sprints,
F2/F3 reverse grids, Italian F4 scoring, GT pit windows, historical WEC endurance,
IndyCar tyre/bonus rules and rally stages with service parks.

Weather, neutralisations, incidents, passing, pit queues, fuel and tyre consumption
feed live timing, replay and race debriefs. Results affect championships, contract
triggers, repair costs, sponsor support and paddock politics. Save and resume an
unfinished race; v6–v9 saves retain their history when upgraded to v10.

Official sporting references and the exact modeled scope are listed in
[racing and strategy](docs/racing.md). Calendars, teams and people are fictional;
LMP1 uses a historical profile and GT4 explicitly uses the published 2024 rules.
See also [motorsport world](docs/motorsport-world.md), [career gameplay](docs/career.md),
[contracts](docs/contracts.md) and [finances](docs/finances.md).

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
