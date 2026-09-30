import type { Contract, PoliticalCoreState } from "@/game/political/types";
import { validatePoliticalCoreState } from "@/game/political/validation";

export type ContractNegotiationStatus =
  | "OPEN"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "STALLED";

export type ContractNegotiationOffer = {
  salaryMillionsPerSeason: number;
  guaranteedSalaryMillions: number;
  extensionRounds: number;
  releaseClauseMillions: number | null;
  performanceBonusMillions: number;
};

export type ContractNegotiationPower = {
  teamPower: number;
  characterPower: number;
  delta: number;
};

export type ContractNegotiationPosture =
  | "FIRM"
  | "BALANCED"
  | "GENEROUS"
  | "CUSTOM";

export type ContractNegotiationHistoryEntry = {
  turn: number;
  by: "TEAM" | "CHARACTER";
  offer: ContractNegotiationOffer;
  acceptanceScore: number | null;
  posture?: ContractNegotiationPosture;
};

export type ContractNegotiationSession = {
  id: string;
  contractId: string;
  characterId: string;
  startedRound: number;
  turn: number;
  status: ContractNegotiationStatus;
  power: ContractNegotiationPower;
  characterDemand: ContractNegotiationOffer;
  latestTeamOffer: ContractNegotiationOffer | null;
  counterOffer: ContractNegotiationOffer | null;
  history: ContractNegotiationHistoryEntry[];
  lastTeamPosture: ContractNegotiationPosture | null;
  followUpIssueDefinitionIds: string[];
};

export type ContractNegotiationResult = {
  political: PoliticalCoreState;
  session: ContractNegotiationSession;
};

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function requireContract(state: PoliticalCoreState, contractId: string): Contract {
  const contract = state.contracts.find((item) => item.id === contractId);
  if (!contract) throw new Error(`Contract "${contractId}" was not found.`);
  return contract;
}

function requireCharacter(state: PoliticalCoreState, characterId: string) {
  const character = state.characters.find((item) => item.id === characterId);
  if (!character) throw new Error(`Character "${characterId}" was not found.`);
  return character;
}

function relationshipToTeamPrincipal(
  state: PoliticalCoreState,
  characterId: string,
) {
  const principal = state.characters.find(
    (character) => character.role === "TEAM_PRINCIPAL",
  );
  if (!principal) throw new Error("No team principal exists in political state.");

  return state.relationships.find(
    (relationship) =>
      relationship.fromCharacterId === characterId &&
      relationship.toCharacterId === principal.id,
  );
}

function characterLeverageScore(
  state: PoliticalCoreState,
  characterId: string,
): number {
  const leverages = state.leverages.filter(
    (leverage) => leverage.ownerCharacterId === characterId && leverage.active,
  );
  if (leverages.length === 0) return 0;

  return Math.max(
    ...leverages.map(
      (leverage) =>
        (leverage.strength * 0.45 +
          leverage.credibility * 0.35 +
          leverage.usability * 0.2) *
        (1 - leverage.risk / 200),
    ),
  );
}

export function calculateNegotiationPower(
  state: PoliticalCoreState,
  contractId: string,
): ContractNegotiationPower {
  const contract = requireContract(state, contractId);
  const character = requireCharacter(state, contract.characterId);
  const principal = state.characters.find(
    (candidate) => candidate.role === "TEAM_PRINCIPAL",
  );
  if (!principal) throw new Error("No team principal exists in political state.");

  const owner = state.characters.find(
    (candidate) =>
      candidate.role === "CEO" ||
      candidate.role === "OWNER_REPRESENTATIVE",
  );

  const teamPower = clamp(
    0,
    100,
    principal.power.formalAuthority * 0.3 +
      principal.power.internalInfluence * 0.25 +
      principal.power.ownerAccess * 0.15 +
      principal.dynamic.institutionalReputation * 0.15 +
      (owner?.power.ownerAccess ?? principal.power.ownerAccess) * 0.15,
  );

  const leverage = characterLeverageScore(state, character.id);
  const characterPower = clamp(
    0,
    100,
    character.career.replacementDifficulty * 0.25 +
      character.career.transferInterest * 0.2 +
      character.power.sportingLeverage * 0.2 +
      character.power.commercialBacking * 0.1 +
      character.power.internalInfluence * 0.1 +
      leverage * 0.15,
  );

  return {
    teamPower: roundMoney(teamPower),
    characterPower: roundMoney(characterPower),
    delta: roundMoney(teamPower - characterPower),
  };
}

export function buildCharacterDemand(
  state: PoliticalCoreState,
  contractId: string,
): ContractNegotiationOffer {
  const contract = requireContract(state, contractId);
  const character = requireCharacter(state, contract.characterId);
  const power = calculateNegotiationPower(state, contractId);
  const leveragePremium = clamp(0, 0.35, (character.career.transferInterest + Math.max(0, -power.delta)) / 400);
  const salaryMultiplier =
    1.08 +
    leveragePremium +
    character.personality.ambition / 500 +
    character.dynamic.momentum / 250;

  const desiredExtension =
    character.career.contractSecurity < 55 ? 36 : 24;
  const releaseClauseMillions =
    character.career.transferInterest >= 40
      ? roundMoney(Math.max(12, contract.salaryMillionsPerSeason * 1.25))
      : null;

  return {
    salaryMillionsPerSeason: roundMoney(
      contract.salaryMillionsPerSeason * salaryMultiplier,
    ),
    guaranteedSalaryMillions: roundMoney(
      contract.guaranteedSalaryMillions * (1.05 + leveragePremium),
    ),
    extensionRounds: desiredExtension,
    releaseClauseMillions,
    performanceBonusMillions: roundMoney(
      Math.max(0.5, contract.salaryMillionsPerSeason * 0.08),
    ),
  };
}

export function createNegotiationOffer(
  session: ContractNegotiationSession,
  posture: Exclude<ContractNegotiationPosture, "CUSTOM">,
): ContractNegotiationOffer {
  const demand = session.characterDemand;
  const factor = posture === "FIRM" ? 0.84 : posture === "BALANCED" ? 0.94 : 1.03;
  const guaranteeFactor =
    posture === "FIRM" ? 0.86 : posture === "BALANCED" ? 0.96 : 1.02;

  return {
    salaryMillionsPerSeason: roundMoney(
      demand.salaryMillionsPerSeason * factor,
    ),
    guaranteedSalaryMillions: roundMoney(
      demand.guaranteedSalaryMillions * guaranteeFactor,
    ),
    extensionRounds:
      posture === "FIRM"
        ? Math.max(12, demand.extensionRounds - 12)
        : demand.extensionRounds,
    releaseClauseMillions:
      posture === "GENEROUS"
        ? demand.releaseClauseMillions
        : posture === "BALANCED" && demand.releaseClauseMillions !== null
          ? roundMoney(demand.releaseClauseMillions * 1.35)
          : null,
    performanceBonusMillions: roundMoney(
      demand.performanceBonusMillions *
        (posture === "FIRM" ? 0.75 : posture === "BALANCED" ? 1 : 1.2),
    ),
  };
}

export function calculateOfferAcceptance(
  state: PoliticalCoreState,
  session: ContractNegotiationSession,
  offer: ContractNegotiationOffer,
): number {
  const demand = session.characterDemand;
  const relationship = relationshipToTeamPrincipal(state, session.characterId);
  const character = requireCharacter(state, session.characterId);

  const salaryFit = clamp(
    0,
    100,
    (offer.salaryMillionsPerSeason / demand.salaryMillionsPerSeason) * 100,
  );
  const guaranteeFit = clamp(
    0,
    100,
    (offer.guaranteedSalaryMillions / demand.guaranteedSalaryMillions) * 100,
  );
  const termFit = clamp(
    0,
    100,
    (offer.extensionRounds / demand.extensionRounds) * 100,
  );
  const releaseFit =
    demand.releaseClauseMillions === null
      ? 85
      : offer.releaseClauseMillions === null
        ? 25
        : clamp(
            0,
            100,
            (demand.releaseClauseMillions / offer.releaseClauseMillions) * 100,
          );
  const bonusFit = clamp(
    0,
    100,
    (offer.performanceBonusMillions / demand.performanceBonusMillions) * 100,
  );

  const relationshipScore = relationship
    ? relationship.trust * 0.45 +
      relationship.loyalty * 0.25 +
      relationship.respect * 0.2 -
      relationship.resentment * 0.1
    : 50;

  const powerAdjustment = clamp(
    -18,
    18,
    session.power.delta * 0.3,
  );

  return clamp(
    0,
    100,
    salaryFit * 0.28 +
      guaranteeFit * 0.18 +
      termFit * 0.12 +
      releaseFit * 0.12 +
      bonusFit * 0.08 +
      relationshipScore * 0.12 +
      character.personality.compromiseWillingness * 0.1 +
      powerAdjustment,
  );
}

function createCounterOffer(
  session: ContractNegotiationSession,
  teamOffer: ContractNegotiationOffer,
): ContractNegotiationOffer {
  const demand = session.characterDemand;
  const concession =
    session.power.delta >= 12 ? 0.48 : session.power.delta >= 0 ? 0.36 : 0.24;

  const interpolate = (team: number, wanted: number) =>
    roundMoney(wanted - (wanted - team) * concession);

  return {
    salaryMillionsPerSeason: interpolate(
      teamOffer.salaryMillionsPerSeason,
      demand.salaryMillionsPerSeason,
    ),
    guaranteedSalaryMillions: interpolate(
      teamOffer.guaranteedSalaryMillions,
      demand.guaranteedSalaryMillions,
    ),
    extensionRounds: Math.round(
      demand.extensionRounds -
        (demand.extensionRounds - teamOffer.extensionRounds) * concession,
    ),
    releaseClauseMillions:
      demand.releaseClauseMillions === null
        ? teamOffer.releaseClauseMillions
        : teamOffer.releaseClauseMillions === null
          ? demand.releaseClauseMillions
          : interpolate(
              demand.releaseClauseMillions,
              teamOffer.releaseClauseMillions,
            ),
    performanceBonusMillions: interpolate(
      teamOffer.performanceBonusMillions,
      demand.performanceBonusMillions,
    ),
  };
}

function applyAcceptedRenewal(
  sourceState: PoliticalCoreState,
  contractId: string,
  offer: ContractNegotiationOffer,
  currentRound: number,
): PoliticalCoreState {
  const nextState = structuredClone(sourceState);
  const contract = requireContract(nextState, contractId);
  const character = requireCharacter(nextState, contract.characterId);

  contract.status = "ACTIVE";
  contract.endRound = Math.max(contract.endRound, currentRound) + offer.extensionRounds;
  contract.salaryMillionsPerSeason = offer.salaryMillionsPerSeason;
  contract.guaranteedSalaryMillions = offer.guaranteedSalaryMillions;

  if (offer.releaseClauseMillions !== null) {
    const existing = contract.releaseClauses.find(
      (clause) => clause.id === `release_${contract.characterId}_renewal`,
    );
    if (existing) {
      existing.amountMillions = offer.releaseClauseMillions;
      existing.activeFromRound = currentRound;
      existing.expiresAfterRound = contract.endRound;
      existing.active = true;
    } else {
      contract.releaseClauses.push({
        id: `release_${contract.characterId}_renewal`,
        amountMillions: offer.releaseClauseMillions,
        activeFromRound: currentRound,
        expiresAfterRound: contract.endRound,
        beneficiary: "CHARACTER",
        active: true,
      });
    }
  }

  character.career.contractSecurity = clamp(
    0,
    100,
    72 + Math.min(24, offer.extensionRounds),
  );
  character.career.transferInterest = clamp(
    0,
    100,
    character.career.transferInterest - 20,
  );

  const validation = validatePoliticalCoreState(nextState);
  if (!validation.success) {
    throw new Error("Accepted contract renewal produced an invalid political state.");
  }

  return validation.data;
}

export function startContractNegotiation(
  state: PoliticalCoreState,
  contractId: string,
  round: number,
): ContractNegotiationSession {
  const contract = requireContract(state, contractId);
  if (contract.status !== "ACTIVE") {
    throw new Error("Only active contracts can be renewed.");
  }

  return {
    id: `negotiation_${contractId}_r${round}`,
    contractId,
    characterId: contract.characterId,
    startedRound: round,
    turn: 1,
    status: "OPEN",
    power: calculateNegotiationPower(state, contractId),
    characterDemand: buildCharacterDemand(state, contractId),
    latestTeamOffer: null,
    counterOffer: null,
    history: [],
    lastTeamPosture: null,
    followUpIssueDefinitionIds: [],
  };
}

export function submitNegotiationOffer(
  sourceState: PoliticalCoreState,
  session: ContractNegotiationSession,
  offer: ContractNegotiationOffer,
  currentRound: number,
  posture: ContractNegotiationPosture = "CUSTOM",
): ContractNegotiationResult {
  if (session.status !== "OPEN" && session.status !== "COUNTERED") {
    throw new Error("Negotiation is no longer open.");
  }

  const acceptanceScore = calculateOfferAcceptance(sourceState, session, offer);
  const history: ContractNegotiationHistoryEntry[] = [
    ...session.history,
    {
      turn: session.turn,
      by: "TEAM",
      offer,
      acceptanceScore: roundMoney(acceptanceScore),
      posture,
    },
  ];

  if (acceptanceScore >= 78) {
    return {
      political: applyAcceptedRenewal(
        sourceState,
        session.contractId,
        offer,
        currentRound,
      ),
      session: {
        ...session,
        turn: session.turn + 1,
        status: "ACCEPTED",
        latestTeamOffer: offer,
        counterOffer: null,
        history,
        lastTeamPosture: posture,
        followUpIssueDefinitionIds: [
          ...(offer.releaseClauseMillions !== null
            ? ["issue_contract_release_precedent"]
            : []),
          ...(posture === "FIRM"
            ? [
                "issue_contract_hard_owner_reaction",
                "issue_contract_hard_sponsor_reaction",
                "issue_contract_hard_staff_reaction",
              ]
            : []),
          ...(posture === "GENEROUS"
            ? [
                "issue_contract_generous_owner_reaction",
                "issue_contract_generous_sponsor_reaction",
                "issue_contract_generous_staff_reaction",
              ]
            : []),
        ],
      },
    };
  }

  if (session.turn >= 3 && acceptanceScore < 78) {
    return {
      political: structuredClone(sourceState),
      session: {
        ...session,
        turn: session.turn + 1,
        status: "STALLED",
        latestTeamOffer: offer,
        counterOffer: null,
        history,
        lastTeamPosture: posture,
        followUpIssueDefinitionIds: [
          "issue_contract_negotiation_stall",
          "issue_contract_failed_owner_reaction",
          "issue_contract_failed_sponsor_reaction",
          "issue_contract_failed_staff_reaction",
        ],
      },
    };
  }

  const counterOffer = createCounterOffer(session, offer);

  return {
    political: structuredClone(sourceState),
    session: {
      ...session,
      turn: session.turn + 1,
      status: "COUNTERED",
      latestTeamOffer: offer,
      counterOffer,
      history: [
        ...history,
        {
          turn: session.turn,
          by: "CHARACTER",
          offer: counterOffer,
          acceptanceScore: null,
        },
      ],
      lastTeamPosture: posture,
      followUpIssueDefinitionIds: [],
    },
  };
}

export function acceptNegotiationCounter(
  sourceState: PoliticalCoreState,
  session: ContractNegotiationSession,
  currentRound: number,
): ContractNegotiationResult {
  if (session.status !== "COUNTERED" || !session.counterOffer) {
    throw new Error("There is no counteroffer to accept.");
  }

  return {
    political: applyAcceptedRenewal(
      sourceState,
      session.contractId,
      session.counterOffer,
      currentRound,
    ),
    session: {
      ...session,
      status: "ACCEPTED",
      turn: session.turn + 1,
      history: session.history,
      followUpIssueDefinitionIds:
        session.counterOffer.releaseClauseMillions !== null
          ? ["issue_contract_release_precedent"]
          : [],
    },
  };
}

export function rejectContractNegotiation(
  sourceState: PoliticalCoreState,
  session: ContractNegotiationSession,
): ContractNegotiationResult {
  if (
    session.status === "ACCEPTED" ||
    session.status === "REJECTED" ||
    session.status === "STALLED"
  ) {
    throw new Error("Negotiation is already closed.");
  }

  const political = structuredClone(sourceState);
  const character = requireCharacter(political, session.characterId);
  character.career.transferInterest = clamp(
    0,
    100,
    character.career.transferInterest + 15,
  );

  return {
    political,
    session: {
      ...session,
      status: "REJECTED",
      counterOffer: null,
      followUpIssueDefinitionIds: [
        "issue_contract_negotiation_stall",
        "issue_contract_failed_owner_reaction",
        "issue_contract_failed_sponsor_reaction",
        "issue_contract_failed_staff_reaction",
      ],
    },
  };
}
