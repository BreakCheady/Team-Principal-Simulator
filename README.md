# Team Principal Simulator

A browser-based motorsport management game about **people, power and paddock politics**.

## Current milestone

**v0.1 – Political Conflict Prototype**

The first vertical slice focuses on a single conflict at Vanguard Racing:

- Luca Moretti wants more influence over technical development.
- Dr. Adrian Chen defends the technical department's authority.
- Noah Keller supports institutional consistency.
- Team Principal Daniel Hartmann is the swing actor.

The prototype validates the game state, calculates context-dependent power, builds faction strength, and derives success chances and escalation.

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
