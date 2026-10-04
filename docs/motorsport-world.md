# Motorsport World and fresh season start

The default home screen is now a championship/team selector. A new career starts in
**preseason (`currentRound: 0`)**; the first advance opens the race-1 weekend. It never passes
through the old R14/R15 tutorial conflicts. Old saves preserve their actual progress.

## World size and series

There are 106 fictional teams, 666 drivers and 748 staff members (1,414 people total).
Each team has a principal, technical director, sporting director, engineering lead
and its series-specific number of driver/car entries. The initial pool includes 48 reserve
drivers and 12 free candidates for each of the three recruitable staff roles per
series. Endurance partners and rally co-drivers are employed from these reserves
without creating extra people. People have unique stable IDs and names, age, nationality, ability, potential,
experience, ambition, compromise, consistency, risk tolerance, terrain skill, salary,
series experience and current employer.

| Series  | Teams | Cars per team | Races per season | Game format                         |
| ------- | ----: | ------------: | ---------------: | ----------------------------------- |
| F1      |    11 |             2 |               24 | Grands Prix                         |
| F2      |    11 |             2 |               28 | 14 sprint/feature meetings          |
| F3      |    10 |             3 |               20 | 10 sprint/feature meetings          |
| F4      |    12 |             2 |               21 | 7 meetings with three races         |
| GT3     |    16 |             2 |               10 | Sprint/endurance events             |
| GT4     |    16 |             2 |               12 | Customer GT meetings                |
| LMP1    |     8 |             2 |                8 | Historical prototype endurance tour |
| IndyCar |    12 |             3 |               17 | Road, street and oval events        |
| Rally   |    10 |             2 |               14 | Snow, gravel and tarmac rallies     |

Names include Silvercrest GP, Sky Bull Racing, Scuderia Rosso, Marlow Racing,
Premio Racing, ARTEM Grand Prix, Mantler Racing, Takumi Gazoo and Granassi Racing.
All team identities, people, venues and financial values are fictional game content.
All teams can be selected at the start, with distinct pace, reliability and budgets.

Series use explicit sporting profiles described in [racing.md](racing.md), including
actual rotating endurance crews, rally co-drivers/stages, qualifying, sprint and
bonus points. Regional grids and all calendars remain fictional. LMP1 is historical,
not presented as the current top FIA WEC class.

Format references used while designing the fictional setup:

- [FIA: 2026 F2 calendar, 11 teams / 22 drivers / 28 races](https://api.fia.com/news/fia-formula-2-championship-2026-season-calendar-revealed)
- [FIA: 11th Formula One team for 2026](https://api.fia.com/news/cadillac-f1-how-fia-paved-way-11th-team-formula-1)
- [INDYCAR: announced 17-race 2026 schedule](https://www.indycar.com/news/2025/09/09-16-2026-sked)
- [FIA: Hypercar replaced LMP1](https://www.fia.com/news/hypercar-explained)

## Playing and recruiting

Pick a series and team. Fresh employment agreements begin at race 1 with zero salary
paid. Cash accounting begins at zero elapsed rounds and championship tables have no
previous points. Payroll, operating costs, sponsorship, emergency funding, development
and prizes scale to the selected team's economy. A junior team cannot receive an
F1-sized emergency cash injection. Contract dates remain absolute within that series;
one season is the selected calendar length, rather than a universal 24 races.

Preseason supports recruitment, paid departures, cost cuts, projects and negotiations.
Costs are immediately reflected in cash and recorded in the first accounting period
(round 1); regular first-race salaries are settled only when race 1 is played.
A preseason signing starts at race 1. A later signing starts on the next race.

The market is searchable by name, nationality or employer, and filterable by source
series, role and free agency. Sort by skill, salary or age; pages contain at most 24
candidate cards. Every candidate corresponds to a persistent world person. Driver
eligibility uses category experience and an in-game skill floor; this is not an FIA
Super Licence implementation. Staff can move between all series.

Signings carry salary, guarantee, buyout and signing costs. Recruiting an employed
person removes them from the original roster; their team fills the role from the free
pool. Rival offers come from actual fictional teams in the selected series. Outgoing
transfers change the receiving roster and can displace an incumbent into free agency.
Existing championship points remain with their original constructor/car team.

## World progression

The selected series uses the full playable management race engine, with the real
selected roster and team capabilities. Event kind influences retirement/terrain
performance. The other eight championships simulate alongside the selected calendar:
normalized season progress determines how many of their events have elapsed. This
is a shared season clock, not a dated day-by-day global schedule.

The Motorsport World tab shows all series, teams, rosters, championship tables and a
searchable people database (30 rows per page). At a season boundary, every series
finishes its calendar, champions enter history, tables reset, people age and promising
young drivers improve toward their potential. Rival teams develop between seasons.
Player contracts and political history remain intact; vacant seats require renewal
or recruitment before they regain sporting capacity.

## Saves and validation

Save version 10 persists the world, selected team/series, calendars, people, transfers,
championship counters, live race weekends, bounded replay and independent PRNG state. Preseason and midseason saves replay
deterministically. Versions 8/9 careers retain their existing round and source history;
v6/v7 retain the earlier migration rules. Existing careers are not silently restarted.

Validation checks employer references, team rosters and roles, unique identities,
championship references, calendar length and world/selected-career season consistency.
The starting save is below the local-storage budget; recruitment and scouting views
paginate the large pool instead of rendering every profile at once.
