# Gameplay loop

The browser UI never mutates political state directly.

```text
Season conflict
    ↓
Player decision
    ↓
Decision definition
    ↓
Generic effect resolver
    ↓
Validated political state
    ↓
Consequence review
    ↓
Next scheduled conflict activates
    ↓
Same changed political state continues
```

## Decision content vs engine

Conflict-specific names and entity IDs live in declarative decision definitions. The resolver only understands generic effect types such as relationship deltas, momentum deltas, goal progress changes, and precedent changes.

Adding a new conflict therefore does not require a new resolver function. A conflict can provide its own decision definitions and reuse the same state transition engine.

## Season flow

A season is an ordered list of conflict steps. Each step defines a conflict ID, its round, and calculation input. Only the current conflict is active. Future conflicts remain dormant until the previous result has been reviewed.

The season uses three phases:

- `DECISION`: the current conflict accepts exactly one player decision.
- `REVIEW`: the resolved result and its political changes remain visible.
- `COMPLETE`: all scheduled conflicts have been resolved.

Advancing from `REVIEW` activates the next dormant conflict without resetting the political state. Relationships, momentum, goals, precedents, and previous conflict outcomes therefore carry forward through the season.
