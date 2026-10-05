# Team Principal Simulator design system

## Direction

The visual language is **Race Control / Team HQ**: a dark, information-rich motorsport command centre with strong hierarchy, modular cards and restrained accent colour.

The uploaded design references point to the same core principles:
- management information should remain dense, but the hierarchy must be obvious;
- important decisions need stronger visual priority than supporting statistics;
- cars, drivers, race state and championship context should carry more visual presence than a pure admin interface;
- cards and modular surfaces should replace long undifferentiated information blocks;
- progressive disclosure should keep the first view readable while preserving deep simulation detail.

The game deliberately borrows these UX principles rather than reproducing another product's branding or screen layouts.

## Core tokens

- Background: near-black race-control surface.
- Panels: layered navy/graphite surfaces with subtle borders.
- Primary accent: cyan for navigation, action and live-system focus.
- Positive state: green.
- Warning state: amber.
- Critical state: rose/red.
- Rounded cards: 18px base radius.
- Numeric data uses tabular figures where possible.

## Product structure

The public website lives at /.
The playable management application lives at /game.

Inside the game:
- **HQ Overview** is the default start surface.
- navigation becomes a persistent desktop sidebar and horizontal mobile rail;
- the top status card owns season, round, cash, save/load and race progression;
- feature workspaces retain their deep data, but sit inside one consistent panel shell.

## Dashboard hierarchy

The HQ overview answers, in order:
1. What happens next?
2. What blocks me?
3. How healthy is the team?
4. What needs a decision?
5. What are my drivers/team doing?
6. What is happening in the paddock?

This follows the source material's emphasis on showing the most important management information first and revealing detail through dedicated modules.

## Website

The landing page should communicate the fantasy before mechanics:
**Win the race. Keep the team.**

The website introduces:
- the team-principal role;
- race strategy;
- people/politics;
- the living multi-series world;
- a direct route into career setup.

Avoid marketing art that implies features not present in the simulation.