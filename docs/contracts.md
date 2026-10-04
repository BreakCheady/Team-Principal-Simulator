# Contract gameplay

Contracts are persistent objects in `PoliticalCoreState.contracts`, linked to a
character. They store signing, start and end rounds; status; seasonal salary;
guaranteed salary; earned bonuses; options; release clauses; and performance triggers.
Paid salary is tracked separately so an outstanding guaranteed minimum can be paid
once when the contract expires. Bonuses do not count toward that salary guarantee.
Round boundaries are inclusive. The round flow expires contracts after their end
round, and contract evaluation cannot award performance benefits outside the active
term or revive an expired or terminated agreement.

## Performance results

An authored round event can provide `contractPerformance` entries containing a
`characterId` and a cumulative season-result snapshot. Supported results are driver
and team championship position, points, wins and podiums. Each snapshot applies only
to contracts for that character; missing metrics do not satisfy a trigger.

The event processor evaluates each trigger once. Consequences pay a bonus into
`earnedBonusesMillions`, unlock a named option, or activate a named release clause.
Triggered salary bonuses also debit the finance ledger immediately. Accepted renewal
bonuses become an additional once-only four-win trigger, and are included in the
contract commitment budget check. Already promised guaranteed pay remains protected.
The round report records newly triggered consequences, and contract cards show the
resulting state. Repeated results cannot pay an already triggered bonus again.

Vanguard's demo gives Keller 145 points and three podiums in round 16, earning his
bonus and unlocking his team option. A result report in round 22 gives Moretti four
wins, second in the drivers' standings and Vanguard fourth in the team championship.
Those results evaluate his bonus, option and release-clause triggers against the
contract currently signed.

## Options and release clauses

The Contract Room allows the team to exercise an unlocked team-held option within
its exercise window and the active contract term. Exercising extends the end round,
applies the salary multiplier, marks the option exercised and updates contract
security. It can happen only once, and ongoing renewal talks must finish first.
Character-held options belong to that character; mutual options require agreement
from both parties and cannot be exercised unilaterally through the team action.

A release clause is in force only while both the contract term and its clause window
are active. In-force release clauses increase the character's transfer interest.
The UI distinguishes locked clauses from activated clauses outside their window.
An option whose exercise window has passed no longer adds extension security.

## Persistence

Option exercise and performance evaluation return a new political state; they do
not mutate the previous game state. Save version 7 persists contracts and finances.
Version-6 saves migrate at their current round without charging past salary or
already triggered bonuses to the new account. See [finances](finances.md) for the
salary-accrual estimate used during migration.


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
