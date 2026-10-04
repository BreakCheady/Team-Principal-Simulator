# v0.6 career mode

The playable Team HQ uses `createCareerFlow` and `advanceCareerFlow`. The lower-level
`createRoundFlowState` / `advanceRoundFlow` still support authored scenarios and unit
tests. The introductory two conflicts remain playable before Team HQ opens at R15.

## Calendar and source state

A career season has 24 races. Contract dates and ledger dates are **absolute rounds**:
R25 is the first race of season two, R49 starts season three. The opening season
simulates R16–24 with zero recorded championship points. Earlier results are not
invented. Later seasons run all 24 races. Political history, cash, contracts, market
activity, projects, PRNG seed, race history and board warnings persist across seasons.
Driver counters reset at each season boundary; contract trigger flags remain one-time
flags for that contract. Constructor points belong to the team at the date of a race,
so a departure does not erase earned team points.

Source career state is Zod-validated separately from political core state. Lineup,
active actor IDs, candidate contracts, requests, standings and calendars have reference
checks. Championship ranking and cash remain derived. Names of departed actors remain
in historical relationships, conflict records and ledger entries.

## Transfers and employment

Five seats are modeled: two drivers, technical director, sporting director and race
engineering lead. On entering career mode, the previously contractless engineering
lead receives an explicit €1.5m seasonal employment agreement and €1.5m guarantee.
The market contains two driver candidates and three staff candidates.
They have skill, ambition, willingness to compromise, salary demands, signing fees,
buyouts and availability windows. Either driver can fill either driver seat.

A signing requires a vacant appropriate seat, 12–48 rounds, the demanded salary and
approval of cash, payroll and total commitments. Weak principal reputation can require
a 20% premium. Salary for the complete term is guaranteed. New actors receive real
contracts (with a character-held option and bilateral release clause), directional
relationships and a career goal. They enter races and autonomous political behavior.

Every sixth round, ambitious actors or those interested in moving can receive rival
offers. Ordinary transfers need team and actor consent. Acceptance books the transfer
fee, settles outstanding guaranteed salary, closes open renewal talks and vacates the
seat. Rejecting an offer raises instability. When an unsettled actor has a valid
character release right at the offer deadline, they can invoke it without team consent.
That mandatory exit still honors guaranteed pay even if cash becomes negative.

The team can exercise an active TEAM/BOTH release right, paying its fee plus remaining
guaranteed pay, or terminate employment by paying the outstanding guarantee. Voluntary
exits cannot exceed available cash plus transfer proceeds. Expired deals remove actors
from the lineup; they no longer race or initiate new team requests. Unfilled seats cost
sporting capacity. Available candidates refresh at season boundaries; this is a small
market, not a full simulation of every rival team's workforce.

## Contractual rights

TEAM options remain unilateral but budget-checked. CHARACTER options are exercised
independently when the actor's trust, compromise and instability imply willingness to
stay; these are binding rights and cannot be vetoed by the voluntary payroll cap.
MUTUAL options require actor consent and team budget approval. All three respect the
active contract term, unlock status, exercise dates and one-time exercise flag. Finish
open renewal talks before requesting a mutual or team extension.

An actor requesting a renewal can only be satisfied after the contract end date has
actually been extended; a promise does not change the contract by itself.

## Autonomous actors

Active actors select urgent high-priority goals, cultivate allies and increase their
influence every third round. Expiring contracts, eligible mutual options and unresolved
political goals generate requests without a player-selected trigger. Owner requests
raise the cash target if supported; sponsor support commits to attack strategy;
staff recovery costs €0.5m; authority concessions increase the actor's influence at
the principal's expense. Refusals damage trust and increase instability.

Unanswered demands escalate after two rounds into political conflicts with the actor,
allies and principal represented. Resolve them through the Career tab. This complements
the original authored inbox: scripted political events are a one-time introductory
story; authored race snapshots are excluded from the playable career mode.

## Racing and development

A seeded PRNG provides reproducible variance and retirement rolls. Scores combine
car pace, driver skill, sporting/engineering capacity, momentum, fatigue, team
stability and strategy. Reliability controls retirement risk. Attack adds five pace
points and five percentage points risk; conserve subtracts three of each. The top ten
classified drivers score 25/18/15/12/10/8/6/4/2/1. There is no fastest-lap point.
The rival field consists of nine fictional teams with two drivers each. It is a
management-level race simulator; there is no lap-by-lap tyre or pitstop model.

Actual cumulative points, wins, podiums and ranks feed contract performance triggers.
The resulting bonuses and clause activations appear in round reports and the ledger.

Two development slots support aero (€3m, four rounds, +7 pace), reliability (€2m,
three rounds, +9 reliability) and operations (€1.2m, two rounds, +8 sporting capacity).
Costs are paid immediately. Staff skill reduces failure risk; fatigue and parallel work raise it. A departing
project leader adds 25 percentage points. Completed projects influence sport and the
sponsor's power. Failed projects retain their sunk costs and raise political pressure.
At each new season, regulations reduce pace by six and reliability by three.

## Board, objectives and game over

Season prizes range from €39m for first to €12m for tenth. The board scores sport (35),
closing cash (30) and political stability (35), against published objectives. Missing
the constructor target costs 12 points per place; missing cash costs two points per
€1m; missing stability costs one point per stability point. Scores below 60 issue a
warning. Below 30, or two consecutive warnings, ends the principal's tenure. Cash
below −€25m causes immediate dismissal after a round. All management actions then
stop; saves can still be loaded and the game can be reset.

After a review, clear open authored inbox issues and choose a consolidated programme
(P5, €0m cash, stability 55) or a title challenge (P2, €5m, stability 65). Sponsor
income is recalculated from last season's rank. Emergency owner funding becomes
available once per new season, with its existing political costs; cost cuts persist.

## Saves

Version 8 stores career state, PRNG seed, market, races, projects and board reviews.
Loading v7 preserves the complete political/financial history and starts championship
counters at the load boundary. Loading v6 first performs the documented finance
migration, then adds the career. A save at the old final round opens the next 24-round
calendar without awarding an invented prize. Current v8 career saves validate IDs,
seats, calendar, references and seed before being accepted. Local storage remains the
save location; there is no server account or cloud synchronization.

## v0.7 world careers

New games now begin in preseason with series/team selection and a complete calendar
from race 1. The large world pool, series economies, actual team rosters and version-9
saves supersede the default nine-race opening described for v0.6 above. Legacy careers
retain their original progress. See [motorsport-world.md](motorsport-world.md) for
current world formats, recruitment, season lengths and the management abstractions.

## v0.8 race weekends

The current race model replaces the earlier one-score result formula with saved
practice/qualifying/grid/race phases, per-car strategy, measured time and series
sporting profiles. Crew employment, finance and political consequences remain
connected. See [racing.md](racing.md) for controls, official sources, save version 10
and the explicitly modeled rule scope.
