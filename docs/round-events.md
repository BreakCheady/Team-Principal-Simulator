# Round and event system

Rounds provide the bridge between sporting events and the Political Core.

```text
Round starts
    ↓
Race / performance / technical / media / contract events
    ↓
Political effects
    ├── momentum
    ├── fatigue / instability
    ├── relationships
    ├── goals
    ├── leverage
    └── precedents
    ↓
Conflict trigger evaluation
    ├── activate dormant conflict
    └── spawn new conflict
    ↓
Validate PoliticalCoreState
    ↓
Conflict Engine v2 recalculates factions and power from the changed state
```

## Event types

The first vertical slice supports five authored event categories:

- `RACE_RESULT`
- `PERFORMANCE_SWING`
- `TECHNICAL_PROBLEM`
- `MEDIA_EVENT`
- `CONTRACT_TALK`

Events are deterministic definitions. Randomness and event selection can be
layered on top later without putting random behavior inside the Political Core.

## Effects

Round events currently support changes to:

- character momentum
- political fatigue
- instability
- directional relationships
- goal progress and urgency
- leverage strength
- precedent strength

Every numeric effect is clamped to the same ranges enforced by the Political
Core schemas.

## Conflict triggers

A trigger evaluates the state **after** the event effects have been applied.

Conditions can currently inspect:

- directional resentment, dependency, or personal leverage
- goal urgency
- character momentum
- leverage strength

If all conditions match, the trigger can either activate an existing dormant
conflict or insert a new conflict definition into the Political Core.

Generated conflicts are deduplicated by ID, so replaying the same event cannot
create duplicate political issues.

## Current Vanguard demo

The demo catalog shows the intended chain:

1. Keller delivers a strong race result → equality pressure rises → the dormant
   driver-status conflict activates.
2. Moretti hits a performance slump → his momentum and stability worsen.
3. A failed upgrade hurts Chen and increases Moretti's technical resentment.
4. Moretti applies public pressure → sponsor leverage rises → a media conflict
   can emerge.
5. Contract talks escalate → transfer leverage and dependency cross the trigger
   threshold → a contract dispute is created.

Because Conflict Engine v2 derives faction membership and power at calculation
time, every later conflict sees the state produced by these round events.



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
