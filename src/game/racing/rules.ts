import type { SeriesId } from "@/game/world/series";
import type { Compound } from "./schema";

export type RaceRules = {
  id: string;
  name: string;
  reference: string;
  format: "CIRCUIT" | "RALLY";
  specCar: boolean;
  minutes: number;
  distanceKm: number | null;
  reverse: number;
  qualifying:
    | "Q123"
    | "SINGLE"
    | "TWO"
    | "FAST6"
    | "OVAL"
    | "SHAKEDOWN"
    | "CREW"
    | "HYPERPOLE";
  compounds: Compound[];
  refuel: boolean;
  fuelLaps: number;
  twoCompounds: boolean;
  mandatoryStop: boolean;
  minStopLap: number;
  tyreMinimumLaps: number;
  alternateSets: number;
  crewSize: number;
  changeDriver: boolean;
  pitWindow: [number, number] | null;
  maxStintMinutes: number | null;
  minDriverMinutes: number;
  sequentialService: boolean;
  pitSeconds: number;
  rollingStart: boolean;
  neutralisation: "VSC" | "FCY" | "SC";
  points: number[];
  poleBonus: number;
  fastestBonus: number;
  minimumDistance: number;
  leadingBonus: boolean;
  requiredStops: number;
};
const STANDARD = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SOURCES = {
  F1: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_09_-_2026-10-01.pdf",
  F2: "https://www.fiaformula2.com/en/latest/article/the-regulations-f2.DyImndAsBNFcqYOOm4yWS",
  F3: "https://www.fiaformula3.com/en/information/the-rules-and-regulations-f3.6Iosy860VzDs0INyfKw37E",
  F4: "https://www.acisport.it/en/F4/regulations/2026",
  GT3: "https://europeregs.sporting.gt-world-challenge.com/assets/2026GTWCSportingRegulations.pdf",
  GT4: "https://www.gt4europeanseries.com/images/2024%20-%20GT4%20European%20Series%20-%20Sporting%20Regulations%20-%20S02.pdf",
  WEC: "https://www.fia.com/system/files/documents/2026_fia_world_endurance_championship_sporting_regulations_clean_v1.2wmsc.pdf",
  INDYCAR:
    "https://epaddock.indycar.com/docs/default-source/rules-regulations-and-policies/2026-indycar-rulebook.pdf",
  RALLY:
    "https://www.fia.com/system/files/documents/2026_wrc_sr_2026_published_25_november_2025.pdf",
};
export function getRaceRules(
  series: SeriesId,
  index: number,
  kind: string,
  session: "SPRINT" | "RACE" | "RALLY" = "RACE",
): RaceRules {
  const base: RaceRules = {
    id: `${series}_2026`,
    name: `${series} 2026`,
    reference: SOURCES[series],
    format: "CIRCUIT",
    specCar: false,
    minutes: 120,
    distanceKm: null,
    reverse: 0,
    qualifying: "SINGLE",
    compounds: ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"],
    refuel: false,
    fuelLaps: 1000,
    twoCompounds: false,
    mandatoryStop: false,
    minStopLap: 1,
    tyreMinimumLaps: 1,
    alternateSets: 0,
    crewSize: 1,
    changeDriver: false,
    pitWindow: null,
    maxStintMinutes: null,
    minDriverMinutes: 0,
    sequentialService: false,
    pitSeconds: 23,
    rollingStart: false,
    neutralisation: "SC",
    points: STANDARD,
    poleBonus: 0,
    fastestBonus: 0,
    minimumDistance: 0.9,
    leadingBonus: false,
    requiredStops: 1,
  };
  if (series === "F1")
    return {
      ...base,
      minutes: session === "SPRINT" ? 60 : 120,
      distanceKm: session === "SPRINT" ? 100 : 305,
      qualifying: "Q123",
      twoCompounds: session !== "SPRINT",
      points: session === "SPRINT" ? [8, 7, 6, 5, 4, 3, 2, 1] : STANDARD,
      neutralisation: "VSC",
    };
  if (series === "F2")
    return {
      ...base,
      specCar: true,
      minutes: kind === "SPRINT" ? 45 : 60,
      distanceKm: kind === "SPRINT" ? 120 : 170,
      reverse: kind === "SPRINT" ? 10 : 0,
      compounds: ["MEDIUM", "SOFT", "WET"],
      twoCompounds: kind !== "SPRINT",
      mandatoryStop: kind !== "SPRINT",
      minStopLap: 6,
      points: kind === "SPRINT" ? [10, 8, 6, 5, 4, 3, 2, 1] : STANDARD,
      poleBonus: kind !== "SPRINT" ? 2 : 0,
      fastestBonus: 1,
    };
  if (series === "F3")
    return {
      ...base,
      specCar: true,
      minutes: kind === "SPRINT" ? 40 : 45,
      reverse: kind === "SPRINT" ? 12 : 0,
      compounds: ["SLICK", "WET"],
      points: kind === "SPRINT" ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] : STANDARD,
      poleBonus: kind !== "SPRINT" ? 2 : 0,
      fastestBonus: 1,
    };
  if (series === "F4")
    return {
      ...base,
      name: "Italienische F4 · Standard-Startaufstellung",
      qualifying: "TWO",
      specCar: true,
      minutes: 30,
      compounds: ["SLICK", "WET"],
      points: [30, 26, 22, 20, 18, 16, 14, 12, 10, 9, 8, 6, 4, 2, 1],
    };
  if (series === "GT3")
    return {
      ...base,
      name: "GT World Challenge Europe · Sprint / Langstrecke",
      qualifying: kind === "ENDURANCE" ? "CREW" : "SINGLE",
      minutes: kind === "ENDURANCE" ? 180 : 60,
      compounds: ["SLICK", "WET"],
      refuel: kind === "ENDURANCE",
      fuelLaps: 35,
      crewSize: kind === "ENDURANCE" ? 3 : 2,
      changeDriver: true,
      pitWindow: kind === "ENDURANCE" ? null : [25 * 60, 35 * 60],
      mandatoryStop: true,
      requiredStops: kind === "ENDURANCE" ? 2 : 1,
      maxStintMinutes: kind === "ENDURANCE" ? 64 : null,
      minDriverMinutes: kind === "ENDURANCE" ? 0 : 25,
      pitSeconds: kind === "ENDURANCE" ? 60 : 52,
      rollingStart: true,
      neutralisation: "FCY",
      poleBonus: 1,
      minimumDistance: 0.7,
    };
  if (series === "GT4")
    return {
      ...base,
      id: "GT4_EU_2024",
      name: "GT4 Europe · sportliches Reglement",
      minutes: 60,
      compounds: ["SLICK", "WET"],
      crewSize: 2,
      changeDriver: true,
      pitWindow: [25 * 60, 35 * 60],
      mandatoryStop: true,
      minDriverMinutes: 25,
      pitSeconds: 65,
      rollingStart: true,
      neutralisation: "FCY",
      poleBonus: 1,
      minimumDistance: 0.7,
    };
  if (series === "WEC") {
    const hours = index % 8 === 2 ? 24 : 6;
    return {
      ...base,
      id: "WEC_2026",
      name: "FIA WEC · Hypercar / LMGT3",
      qualifying: "HYPERPOLE",
      minutes: hours * 60,
      compounds: ["SLICK", "WET"],
      refuel: true,
      fuelLaps: 30,
      crewSize: 3,
      changeDriver: true,
      maxStintMinutes: null,
      minDriverMinutes: 45,
      sequentialService: true,
      pitSeconds: 30,
      rollingStart: true,
      neutralisation: "FCY",
      poleBonus: 1,
      minimumDistance: 0.7,
      points:
        hours === 24
          ? [50, 36, 30, 24, 20, 16, 12, 8, 4, 2]
          : [...STANDARD],
    };
  }
  if (series === "INDYCAR")
    return {
      ...base,
      name: `IndyCar 2026 · ${kind.toLowerCase()}`,
      qualifying: kind === "OVAL" ? "OVAL" : "FAST6",
      minutes: kind === "OVAL" ? 150 : 110,
      distanceKm: kind === "OVAL" && index === 6 ? 804.672 : null,
      compounds:
        kind === "OVAL" ? ["PRIMARY"] : ["PRIMARY", "ALTERNATE", "WET"],
      refuel: true,
      fuelLaps: kind === "OVAL" ? 45 : 28,
      twoCompounds: kind !== "OVAL",
      tyreMinimumLaps: 2,
      alternateSets: kind === "STREET" ? 2 : kind === "OVAL" ? 0 : 1,
      pitSeconds: kind === "OVAL" ? 30 : 25,
      rollingStart: true,
      minimumDistance: 0,
      leadingBonus: true,
      poleBonus: 1,
      points: Array.from(
        { length: 40 },
        (_, i) =>
          [50, 40, 35, 32, 30, 28, 26, 24, 22, 20][i] ?? Math.max(5, 29 - i),
      ),
    };
  return {
    ...base,
    name: "WRC · Rallye nach Etappenzeit",
    format: "RALLY",
    qualifying: "SHAKEDOWN",
    minutes: 240,
    compounds:
      kind === "SNOW"
        ? ["SNOW"]
        : kind === "GRAVEL"
          ? ["GRAVEL"]
          : ["SOFT", "HARD", "WET"],
    refuel: true,
    crewSize: 1,
    fuelLaps: 4,
    pitSeconds: 0,
    points: [25, 17, 15, 12, 10, 8, 6, 4, 2, 1],
    minimumDistance: 1,
  };
}
export function crewSizeForSeries(series: SeriesId) {
  return series === "WEC" || series === "GT3" ? 3 : series === "GT4" ? 2 : 1;
}
export function isSprintWeekend(series: SeriesId, index: number) {
  return series === "F1" && [1, 4, 6, 10, 13, 17].includes(index);
}
export function meetingIndex(series: SeriesId, index: number) {
  return Math.floor(
    index /
      (series === "F2" || series === "F3"
        ? 2
        : series === "F4"
          ? 3
          : series === "GT4"
            ? 2
            : 1),
  );
}
export function tyreLife(compound: Compound, abrasion: number) {
  const base = {
    SOFT: 18,
    MEDIUM: 29,
    HARD: 40,
    PRIMARY: 34,
    ALTERNATE: 20,
    SLICK: 40,
    INTERMEDIATE: 30,
    WET: 34,
    GRAVEL: 4,
    SNOW: 4,
  }[compound];
  return base * (1.35 - abrasion / 130);
}
export function tyrePenalty(compound: Compound, wetness: number, wear: number) {
  const wet = compound === "WET",
    inter = compound === "INTERMEDIATE",
    terrain = compound === "GRAVEL" || compound === "SNOW";
  return (
    (terrain
      ? 0
      : wet
        ? Math.max(0, 55 - wetness) * 0.11
        : inter
          ? Math.abs(wetness - 40) * 0.045
          : Math.max(0, wetness - 12) * 0.16) +
    (compound === "SOFT" || compound === "ALTERNATE"
      ? -0.5
      : compound === "HARD"
        ? 0.35
        : 0) +
    Math.max(0, wear - 35) * 0.018 +
    Math.max(0, wear - 78) ** 2 * 0.012
  );
}
