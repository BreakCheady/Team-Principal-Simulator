import { z } from "zod";
export const SeriesIdSchema = z.enum([
  "F1",
  "F2",
  "F3",
  "F4",
  "GT3",
  "GT4",
  "LMP1",
  "INDYCAR",
  "RALLY",
]);
export type SeriesId = z.infer<typeof SeriesIdSchema>;
export type EventKind =
  | "SPRINT"
  | "FEATURE"
  | "ENDURANCE"
  | "ROAD"
  | "OVAL"
  | "GRAVEL"
  | "TARMAC"
  | "SNOW";
export type SeriesDefinition = {
  id: SeriesId;
  name: string;
  category: "FORMULA" | "GT" | "PROTOTYPE" | "AMERICAN" | "RALLY";
  description: string;
  teamNames: string[];
  driversPerTeam: number;
  rounds: number;
  budget: number;
  minDriverSkill: number;
  calendar: { name: string; kind: EventKind }[];
  points: number[];
};
const circuits = [
  "Crescent Bay",
  "Desert Crown",
  "Port Azure",
  "Sakura Park",
  "Highland Ring",
  "Alpine Valley",
  "Royal Harbour",
  "Iberian Ridge",
  "Lakeside Park",
  "Adriatic Coast",
  "Silver Meadows",
  "Ardennes Forest",
  "Danube Ring",
  "Orange Dunes",
  "Royal Monza",
  "Marina Lights",
  "Liberty Park",
  "Aztec Valley",
  "Tropical Hills",
  "Neon Strip",
  "Pearl Coast",
  "Sunset Marina",
  "Pacific Ridge",
  "Emerald Circuit",
];
function calendar(id: SeriesId, rounds: number) {
  return Array.from({ length: rounds }, (_, i) => {
    if (id === "RALLY")
      return {
        name: [
          "Arctic Pines",
          "Monte Sierra",
          "Savannah Trails",
          "Atlantic Gravel",
          "Adriatic Tarmac",
          "Mediterranean Rocks",
          "Rift Valley",
          "Baltic Forest",
          "Thousand Lakes",
          "Andean Heights",
          "Aegean Dust",
          "Iberian Asphalt",
          "Pacific Hinterland",
          "Desert Dunes",
        ][i],
        kind: (i === 0
          ? "SNOW"
          : i % 3 === 1
            ? "TARMAC"
            : "GRAVEL") as EventKind,
      };
    if (id === "LMP1")
      return {
        name: [
          "Desert 6 Hours",
          "Riviera 6 Hours",
          "Ardennes 6 Hours",
          "La Sarthe Classic 24 Hours",
          "Atlantic 6 Hours",
          "Pacific 6 Hours",
          "Sakura 6 Hours",
          "Gulf 8 Hours",
        ][i],
        kind: "ENDURANCE" as const,
      };
    if (id === "INDYCAR")
      return {
        name: [
          "Palm Coast",
          "Cactus Oval",
          "Trinity Streets",
          "Long Shore",
          "Alabama Hills",
          "Independence Road",
          "Centennial 500",
          "Detroit River",
          "Gateway Oval",
          "Elkhart Forest",
          "Midland Road",
          "Prairie Oval",
          "Toronto Harbour",
          "Pacific Speedway",
          "Rose City",
          "Music Valley Oval",
          "Monterey Ridge",
        ][i],
        kind: (i === 1 || i === 6 || i === 8 || i === 11 || i === 13 || i === 15
          ? "OVAL"
          : "ROAD") as EventKind,
      };
    const perWeekend =
      id === "F4"
        ? 3
        : id === "F2" || id === "F3" || id === "GT3" || id === "GT4"
          ? 2
          : 1;
    const weekend = Math.floor(i / perWeekend),
      kind =
        id === "GT3"
          ? i % 2
            ? "ENDURANCE"
            : "SPRINT"
          : perWeekend > 1 && i % perWeekend < perWeekend - 1
            ? "SPRINT"
            : "FEATURE";
    return {
      name: `${circuits[weekend]}${perWeekend > 1 ? ` · ${kind.toLowerCase()} ${(i % perWeekend) + 1}` : " Grand Prix"}`,
      kind: kind as EventKind,
    };
  });
}
const standard = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const specs: [
  SeriesId,
  string,
  SeriesDefinition["category"],
  number,
  number,
  number,
  number,
  string[],
][] = [
  [
    "F1",
    "Formula 1",
    "FORMULA",
    2,
    24,
    120,
    75,
    [
      "Silvercrest GP",
      "Sky Bull Racing",
      "Scuderia Rosso",
      "Marlow Racing",
      "Asterion Racing",
      "Altura GP",
      "Willsport Racing",
      "Falcon GP",
      "Sakura Motorsport",
      "Continental Racing",
      "Vanguard Racing",
    ],
  ],
  [
    "F2",
    "Formula 2",
    "FORMULA",
    2,
    28,
    10,
    60,
    [
      "Premio Racing",
      "ARTEM Grand Prix",
      "Campo Motorsport",
      "Northlight Racing",
      "Mistral Motorsport",
      "Rodan Racing",
      "Dynatek",
      "Tridenta Racing",
      "Vortex Motorsport",
      "Arden Crest",
      "Invicta Nova",
    ],
  ],
  [
    "F3",
    "Formula 3",
    "FORMULA",
    3,
    20,
    4,
    48,
    [
      "Premio Academy",
      "ARTEM Junior",
      "Campo Academy",
      "Northlight Junior",
      "Tridenta Academy",
      "Rodan Junior",
      "Mistral Academy",
      "Aurora Racing",
      "Jenner Motorsport",
      "Delta Phoenix",
    ],
  ],
  [
    "F4",
    "Formula 4",
    "FORMULA",
    2,
    21,
    1,
    35,
    [
      "Van Amstel Racing",
      "Iron Lynx Academy",
      "Ravenol Junior",
      "US Formula Academy",
      "Pacific Formula",
      "Nordic Junior",
      "Iberia Racing",
      "Baltic Academy",
      "Dragonfly Racing",
      "Kiwi Formula",
      "Andean Juniors",
      "Emerald Academy",
    ],
  ],
  [
    "GT3",
    "GT3 World Tour",
    "GT",
    2,
    10,
    20,
    55,
    [
      "Mantler Racing",
      "WRT Horizon",
      "Rowen Motorsport",
      "Black Falconer",
      "Iron Lions",
      "Saintlake Racing",
      "Emilia Corse",
      "Orange One Racing",
      "Hauptstadt Motorsport",
      "Walken Racing",
      "Absolute Apex",
      "Triad Racing",
      "Garage Fifty",
      "Greenlight GT",
      "Phoenix Crown",
      "Vanguard GT",
    ],
  ],
  [
    "GT4",
    "GT4 Continental Cup",
    "GT",
    2,
    12,
    6,
    40,
    [
      "Academy Apex",
      "Century Crest",
      "Allied Motorsport",
      "Borusan Blue",
      "Phoenix Junior",
      "Mantler Clubsport",
      "Selleslagh Crown",
      "Racing Spirit Alpine",
      "Speedline Racing",
      "Team Meadow",
      "Kessel Crest",
      "Saintlake Junior",
      "Nordic GT",
      "Pacific GT",
      "Orion Clubsport",
      "Vanguard Clubsport",
    ],
  ],
  [
    "LMP1",
    "LMP1 Heritage Championship",
    "PROTOTYPE",
    2,
    8,
    80,
    65,
    [
      "Takumi Gazoo",
      "Aurex Sport",
      "Pfeiffer Motorsport",
      "Rebellion Crest",
      "Byfield Racing",
      "Ginetra Prototype",
      "Nissanora Nismo",
      "Vanguard Prototype",
    ],
  ],
  [
    "INDYCAR",
    "IndyCar Championship",
    "AMERICAN",
    3,
    17,
    45,
    60,
    [
      "Penske Horizon",
      "Granassi Racing",
      "Andretta Global",
      "Arrow Marlow",
      "Rahal Lanigan Crest",
      "Dale Cohen Racing",
      "Foyton Racing",
      "Carpenter Crest",
      "Meyer Shankland",
      "Juncos Hollister",
      "Prema Pacific",
      "Vanguard Indy",
    ],
  ],
  [
    "RALLY",
    "World Rally Tour",
    "RALLY",
    2,
    14,
    16,
    50,
    [
      "Takumi Rally",
      "Hyunstar Motorsport",
      "M-Sport Falcon",
      "Skodra Rally",
      "Citara Racing",
      "Subara World Rally",
      "Peugeot Crest",
      "Lancia Nova",
      "Alpine Trail",
      "Vanguard Rally",
    ],
  ],
];
export const SERIES: SeriesDefinition[] = specs.map(
  ([
    id,
    name,
    category,
    driversPerTeam,
    rounds,
    budget,
    minDriverSkill,
    teamNames,
  ]) => ({
    id,
    name,
    category,
    driversPerTeam,
    rounds,
    budget,
    minDriverSkill,
    teamNames,
    calendar: calendar(id, rounds),
    points:
      id === "INDYCAR"
        ? [
            50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13,
            12, 11, 10, 9, 8, 7, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
          ]
        : standard,
    description:
      id === "LMP1"
        ? "Historical prototype category, reimagined as a fictional heritage championship."
        : id === "RALLY"
          ? "Gravel, tarmac and snow rallies with terrain-dependent performance."
          : id === "INDYCAR"
            ? "Road courses, street races and ovals; three-car team model."
            : id === "F4"
              ? "Regional-style junior championship with three races per meeting."
              : id === "F2" || id === "F3"
                ? "Junior formula championship with sprint and feature races."
                : category === "GT"
                  ? "Customer GT championship; each driver represents one car entry."
                  : "Top-tier open-wheel championship with two cars per team.",
  }),
);
export function getSeries(id: SeriesId): SeriesDefinition {
  const s = SERIES.find((s) => s.id === id);
  if (!s) throw new Error("Unknown racing series.");
  return s;
}
export function pointsForEvent(series: SeriesDefinition, index: number) {
  const kind = series.calendar[index % series.rounds]?.kind;
  if ((series.id === "F2" || series.id === "F3") && kind === "SPRINT")
    return [10, 8, 6, 5, 4, 3, 2, 1];
  return series.points;
}
