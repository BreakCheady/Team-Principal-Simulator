# Team Principal Simulator

A browser-based motorsport management game about **people, power and paddock politics**.

## Current milestone

**v0.4 – Multi-Actor Political Sandbox with playable contracts**

Lead Vanguard Racing through sequential conflicts, round events and inbox decisions.
Sporting Director, Owner/CEO, Sponsor and Staff actors have their own goals, leverage
and political follow-up issues. Decisions persist and change later power struggles.

Contracts contain terms, salary, guaranteed value, options, release clauses and
performance triggers. Authored cumulative results automatically award bonuses and
activate clauses. Exercise eligible team options in the Contract Room, or negotiate
renewals through offers and counteroffers with political consequences.

Save and load the current game locally. See [contract gameplay](docs/contracts.md)
for lifecycle rules and the result-to-contract flow.

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
