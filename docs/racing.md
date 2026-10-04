# v0.8 Race weekends, strategy and simulation

Starting a round opens a saved race weekend. Practice gives engineer feedback on
setup and tyre life; qualifying creates the grid. Each car has its own setup,
starting tyres, pit plan, fuel load, repair policy and driver-change policy.
Attack, balanced, conserve and defend instructions change pace, consumption and risk.

Run one lap/stage, run until a decision, autoplay with decision pauses, or finish the
remaining weekend. Live timing, weather forecasts, wear, fuel, damage, radio messages
and crew driving time remain visible. Setup locks after qualifying. Management and
recruitment resume after the weekend; saving/loading works throughout it.

## Sporting profiles

The grid, teams, venues and calendars remain fictional. Rules below are explicit
selected profiles, not a claim to implement every FIA/SRO sporting or technical rule.
Regional F4 and GT series do not have one universal worldwide rulebook.

| Series  | Implemented sporting profile                                                                                                                                                                                                                                                                                                      | Official reference                                                                                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1      | 2026 Q1/Q2/Q3, 305km race with time limit, six fictional 100km sprint weekends, separate sprint/main qualifying, 8–1 sprint points, two dry specifications unless wet tyres are used, no race refuelling or fastest-lap bonus                                                                                                     | [FIA Section B, issue 9, 1 October 2026](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_09_-_2026-10-01.pdf) |
| F2      | Identical base cars, 120km/45min sprint with top ten reversed, 170km/60min feature, mandatory tyre stop after six laps, two dry specifications unless wet; feature pole and top-ten fastest-lap bonuses                                                                                                                           | [F2 regulations](https://www.fiaformula2.com/en/latest/article/the-regulations-f2.DyImndAsBNFcqYOOm4yWS)                                                    |
| F3      | Identical base cars, 40min + one lap sprint with top twelve reversed, 45min + one lap feature; feature pole/top-ten fastest-lap bonuses; no mandatory stop                                                                                                                                                                        | [F3 regulations](https://www.fiaformula3.com/en/information/the-rules-and-regulations-f3.6Iosy860VzDs0INyfKw37E)                                            |
| F4      | Italian F4 2026 standard-capacity grid, three 30min + one lap races, two qualifying sessions and second-best lap for race three, new top-fifteen points                                                                                                                                                                           | [ACI Sport 2026 regulations](https://www.acisport.it/en/F4/regulations/2026)                                                                                |
| GT3     | GT World Challenge Europe 2026 unified 25–35min sprint pit window, two drivers/one change, no sprint refuelling; three-hour endurance Format A with three drivers, crew-average qualifying, fuel and at least two mandatory changes/stops; selected 64-minute endurance driving-time profile                                      | [SRO 2026 sporting regulations](https://europeregs.sporting.gt-world-challenge.com/assets/2026GTWCSportingRegulations.pdf)                                  |
| GT4     | Published GT4 Europe **2024** profile: two one-hour races, two drivers, qualifying by alternating drivers, mandatory 25–35min change, no refuelling, delayed opening under caution                                                                                                                                                | [SRO published regulations](https://www.gt4europeanseries.com/images/2024%20-%20GT4%20European%20Series%20-%20Sporting%20Regulations%20-%20S02.pdf)         |
| LMP1    | Historical WEC 2019–20 profile, six/eight/24-hour events, three-driver crews, two-driver qualifying average, refuelling and tyres serviced sequentially, minimum driving time and duration-weighted points                                                                                                                        | [FIA WEC 2019–20](https://www.fia.com/sites/default/files/fia_world_endurance_championship_sporting_regulations_2019-2020_wmsc041019_-_marked-up.pdf)       |
| IndyCar | 2026 road/street/oval profiles, road Fast Six and oval two-lap average, rolling starts/refuelling/caution pit closure, road primary + alternate; streets require two alternate sets, each required set at least two laps including a green lap; oval-only primary, leading/pole bonuses and fictional 500-mile qualifying bonuses | [2026 rulebook](https://epaddock.indycar.com/docs/default-source/rules-regulations-and-policies/2026-indycar-rulebook.pdf)                                  |
| Rally   | WRC 2026 finish/Sunday/Power Stage points, 18 fictional timed stages, service parks, surface tyres and real employed co-drivers; no circuit overtaking or pit calls                                                                                                                                                               | [FIA 2026 sporting regulations](https://www.fia.com/system/files/documents/2026_wrc_sr_2026_published_25_november_2025.pdf)                                 |

F2/F3 reuse meeting qualifying for the feature. F4 carries both sessions across its
three races. GT teams score their best car; eligible partners share the car's driver
points. WEC classified positions outside the top ten receive the historical half
point (six hours) or one point (eight/24 hours). IndyCar team totals are a game
aggregate, not the official driver/manufacturer championship.

## Race model and consequences

A deterministic clock schedules each car's next lap completion. Pace combines the
car, active driver, setup, tyre compound/wear, fuel mass, weather, fatigue and
confidence. Drivers encounter dirty air, passing opportunities and slower-class
traffic in LMP1. Different modes trade speed against fuel, tyre life and incident
risk. Opponents use the same tyre/fuel/stop engine and can respond to weather or
attempt an undercut. Double-stacking costs time; pit skill influences service errors.

Mechanical failures, accidents, punctures and repeated track-limit breaches can
produce retirements, damage or penalties. SC/VSC/FCY prohibit normal passes; severe
standing water triggers a red-flag delay. Mandatory stops, dry-tyre specifications,
IndyCar sets and incomplete crews are checked before final classification. Team
orders may be refused and create actual trust/resentment and actor requests.

Completion books one race report, championship points, contract performance, damage
costs and political consequences exactly once. Reports include qualifying, points,
crew driving time, explanations, event history, a position chart and telemetry
replay. Repair costs use the existing finance ledger. Contract/financial dates stay
on the original career clock; an unfinished race has no prematurely awarded points.

Extra endurance drivers and rally co-drivers come from the persistent 666-driver
pool and have actual employment and salary contracts. They can be released and
recruited through the cockpit's crew manager. Missing partners require recruitment;
expired contracts are not silently renewed.

## Scope and deliberate simplifications

Tyre life, fuel capacity, setup coefficients, passing probability, pit loss, repair
costs and incident rates are game calibration. Per-lap simulation abstracts sectors
and detailed car physics; it does not reproduce DRS/2026 energy systems, technical
homologation, licences, tyre allocation quotas or every discretionary steward
procedure. Penalties use deterministic time/exclusion equivalents. Wet-tyre waivers
are checked per car; IndyCar's field-wide wet-race declaration is simplified.

GT3 uses one selected endurance driving-time profile rather than each venue's event
bulletins. WEC rotates real crews and checks minimum driving time, but its complete
rolling-six-hour/max-total driving-time tables and rating exceptions are not yet
modeled. The slower GT traffic entries are fictional, not a reconstruction of the
historical WEC class roster. Rally restart/Super Rally and road-order procedures are
abstracted. Fictional calendars are not live 2026 schedules.

All nine championships use the same individual-lap/stage engine. Other series
advance on normalized season progress; their detailed radio/replay is omitted
from the player save. Equal saves and actions produce equal results, including
weather and random events.

Save version **10** persists active weekends and bounded telemetry. Versions 6–9
retain their progress, paid salary, finance and political history. Legacy worlds get
real crew employment at the next weekend boundary, without backdated salary charges.
