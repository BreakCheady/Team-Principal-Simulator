# Team finances

The finance ledger is part of the persisted political core. Store the opening cash,
settings, settlement cursor and transactions; derive cash, budget headroom and
forecasts. Money is expressed in millions and rounded to euro precision for bookings.
The demo account opens after round 15, when the initial political conflict sequence
finishes. Earlier salary accrual is included in each contract's paid-salary balance.

## Vanguard settings

| Setting | Initial value |
| --- | --- |
| Opening cash | €18m |
| Sponsor income per round | €2m |
| Owner contribution per round | €0.75m |
| Operating costs per round | €2.3m |
| Salary periods per season | 24 |
| Annual payroll budget | €70m |
| Contract commitment budget | €180m |
| Emergency owner funding | €20m, once per account |

## Payments

Advancing a round settles every elapsed accounting round, including gaps in the
authored event schedule. Income and operating costs are booked once per round.
Active contracts pay seasonal salary divided by 24 within inclusive start/end
boundaries. Paid salary is tracked on the contract. A renewal or option settles the
current round under the old terms before changing future salary payments.

Performance bonuses debit cash immediately when their trigger fires. Repeated
results and repeated settlement calls cannot duplicate payments. At expiry, any
remaining guaranteed salary is paid once before the contract becomes expired.
Terminated contracts also settle an outstanding minimum without continuing salary.
The guarantee is a minimum total salary, so ordinary salary payments reduce the
outstanding guarantee; it is not deducted in full again at renewal. Bonuses are
separate. Mandatory payments continue even if the resulting cash balance is negative.

## Contract budgets

Team offers, counteroffer acceptance and team-held option exercise check:

1. Annual payroll against the approved payroll budget.
2. Outstanding guarantees or future salary, whichever is higher per contract,
   plus unpaid potential bonuses against the commitment budget.
3. Projected next-round cash after income, operating costs, salaries and any
   guarantees falling due. Voluntary deals cannot create a negative forecast.

The Contract Room previews blocked deals and their reason before the player acts.
Existing guarantees cannot be reduced by negotiating a smaller replacement value.
Character-held and mutual contractual options remain subject to their own holder
rules; the team cannot exercise them unilaterally.

## Financial decisions

Below €8m cash, request one €20m owner injection. It reduces the principal's
institutional reputation by 8 and the owner's trust in the principal by 10, while
increasing the owner's internal influence by 5. Funding does not raise the payroll
or commitment caps.

Alternatively, cut future operating costs by 20% once. Technical directors and
race engineers each gain 8 instability and 8 political fatigue. Already booked
expenses remain unchanged. Both choices persist in saves and affect derived politics.

## Save compatibility

New saves use version 7. Version-6 round-flow saves retain the political state,
contracts, triggered bonuses, issues, negotiations and round history. Their finance
account starts with €18m at the loaded round and an empty ledger, so earlier events
are not charged again. Earlier paid salary is estimated from the current contract's
seasonal salary and elapsed contract rounds. Historical salary rates were not stored
in version 6, so this estimate cannot reconstruct earlier renewals exactly.
Already expired or terminated legacy contracts are treated as having settled their
minimum before the new account opens, avoiding retrospective guarantee charges.

Version-7 loads validate the finance ledger and reject missing finance data,
unknown contract references, duplicate bookings and invalid amounts.


## v0.6 career integration

The playable Team HQ now runs a continuing career. See [career.md](career.md) for
transfers, independent actors, contractual consent, simulated races, development,
board objectives and version-8 migration. Authored performance snapshots remain
available to scenario tests; career mode uses only results from the race simulator.
Contracts and finance rounds continue across the 24-race season boundary.
