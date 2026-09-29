# Gameplay loop

The browser UI never mutates political state directly.

```text
Player choice
    ↓
Decision ID
    ↓
Pure simulation transition
    ↓
Validated next source state
    ↓
Derived political calculations
    ↓
Visible consequences
```

## Current vertical slice

The technical-direction conflict supports three deterministic decisions:

- Support Moretti
- Offer compromise
- Support Chen

Each decision resolves the conflict and can change relationships, momentum, goals, and precedent state.

The transition engine clones the source state before applying changes and validates the resulting state before it is returned to the UI.
