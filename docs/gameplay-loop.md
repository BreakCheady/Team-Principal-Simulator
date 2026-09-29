# Gameplay loop

The browser UI never mutates political state directly.

```text
Player choice
    ↓
Decision definition
    ↓
Generic effect resolver
    ↓
Validated next source state
    ↓
Derived political calculations
    ↓
Visible consequences
```

## Decision content vs engine

Conflict-specific names and entity IDs live in declarative decision definitions. The resolver only understands generic effect types such as relationship deltas, momentum deltas, goal progress changes, and precedent changes.

Adding a new conflict therefore does not require a new resolver function. A conflict can provide its own decision definitions and reuse the same state transition engine.

The transition engine clones the source state before applying effects and the game-state boundary validates the resulting state before returning it to the UI.
