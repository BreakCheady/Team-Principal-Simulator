# Gameplay loop

The browser UI never mutates political state directly.

```text
Season conflict
    ↓
Current political source state
    ↓
Derived conflict factors
    ├── Dynamic faction formation
    ├── Willingness to act
    ├── Alliance power
    ├── Faction momentum
    ├── Active leverage
    ├── Cross-faction resentment
    └── Political cost
    ↓
Player decision
    ↓
Generic effect resolver
    ↓
Validated political state
    ↓
Consequence review
    ↓
Next scheduled conflict activates
    ↓
Changed source state produces a changed political calculation
```

## Source state vs derived state

The Political Core stores durable source facts: characters, relationships, goals,
leverage, precedents, conflicts, and resolved outcomes.

Conflict Engine v2 derives the values that should react to those facts at runtime:

- **Dynamic faction formation** keeps the two conflict leaders fixed but
  re-evaluates every other character from directional relationships, active
  goals/interests, role affinity, and political engagement. Characters can
  join faction A, join faction B, remain neutral, or become swing actors. A
  non-leading Team Principal remains a swing actor so the player retains the
  decision role.
- **Willingness to act** uses assertiveness, ambition, active goal pressure,
  momentum, political fatigue, and conflict stakes.
- **Alliance power** uses directional trust, loyalty, dependency, respect, and
  the ally's contextual power with diminishing returns.
- **Faction momentum** is derived from the current momentum of faction members.
- **Leverage** comes only from active, usable leverage owned by faction members.
- **Cross-faction resentment** is derived from directional relationships between
  opposing faction members.
- **Political cost** reacts to legitimacy, resentment, public exposure,
  relevant precedent strength, and instability.
- **Faction membership** is re-formed at calculation time. Leaders stay fixed;
  every other character is scored against both sides using directional
  relationships, active goals/interests, and institutional legitimacy. Large
  score gaps create faction members, medium gaps create swing actors, and
  balanced or weak preferences remain neutral.

Because membership is derived rather than authoritative source data, a changed
relationship or goal can move an actor between a faction, swing position, and
neutrality in the next conflict calculation.

Scenario calculation inputs are optional overrides for authored exceptions and
testing. The normal season prototype leaves them empty and relies on the live
political state.

## Decision content vs engine

Conflict-specific names and entity IDs live in declarative decision definitions.
The resolver only understands generic effect types such as relationship deltas,
momentum deltas, goal progress changes, and precedent changes.

Adding a new conflict therefore does not require a new resolver function. A
conflict can provide its own decision definitions and reuse the same state
transition engine.

## Season flow

A season is an ordered list of conflict steps. Each step defines a conflict ID,
its round, and optional scenario overrides. Only the current conflict is active.
Future conflicts remain dormant until the previous result has been reviewed.

The season uses three phases:

- `DECISION`: the current conflict accepts exactly one player decision.
- `REVIEW`: the resolved result and its political changes remain visible.
- `COMPLETE`: all scheduled conflicts have been resolved.

Advancing from `REVIEW` activates the next dormant conflict without resetting
the political state. Relationships, momentum, goals, precedents, leverage, and
previous conflict outcomes therefore carry forward and affect later conflict
calculations.
