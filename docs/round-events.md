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
