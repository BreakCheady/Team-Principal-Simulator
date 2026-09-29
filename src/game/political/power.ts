import type { Character } from "./types";

export type PowerContext =
  | "TECHNICAL_DIRECTION"
  | "DRIVER_HIERARCHY"
  | "PERSONNEL_DECISION"
  | "REGULATION_POLITICS";

const weights: Record<PowerContext, Record<keyof Character["power"], number>> = {
  TECHNICAL_DIRECTION: {
    formalAuthority: 0.2,
    internalInfluence: 0.35,
    ownerAccess: 0.1,
    sportingLeverage: 0.25,
    mediaInfluence: 0.05,
    commercialBacking: 0.05,
  },
  DRIVER_HIERARCHY: {
    formalAuthority: 0.1,
    internalInfluence: 0.15,
    ownerAccess: 0.1,
    sportingLeverage: 0.35,
    mediaInfluence: 0.15,
    commercialBacking: 0.15,
  },
  PERSONNEL_DECISION: {
    formalAuthority: 0.3,
    internalInfluence: 0.3,
    ownerAccess: 0.15,
    sportingLeverage: 0.15,
    mediaInfluence: 0.05,
    commercialBacking: 0.05,
  },
  REGULATION_POLITICS: {
    formalAuthority: 0.2,
    internalInfluence: 0.15,
    ownerAccess: 0.3,
    sportingLeverage: 0.05,
    mediaInfluence: 0.15,
    commercialBacking: 0.15,
  },
};

export function calculateContextualPower(character: Character, context: PowerContext): number {
  const contextWeights = weights[context];
  return Object.entries(contextWeights).reduce(
    (sum, [key, weight]) => sum + character.power[key as keyof Character["power"]] * weight,
    0,
  );
}

export function calculateProjectedPower(
  contextualPower: number,
  willingnessToAct: number,
): number {
  if (willingnessToAct < 0 || willingnessToAct > 1) {
    throw new RangeError("willingnessToAct must be between 0 and 1.");
  }

  return contextualPower * willingnessToAct;
}
