import { describe, expect, it } from "vitest";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  acceptNegotiationCounter,
  calculateNegotiationPower,
  createNegotiationOffer,
  startContractNegotiation,
  submitNegotiationOffer,
} from "../../src/game/contracts/negotiations";
import {
  createRoundFlowState,
  getOpenIssues,
  rejectRoundContractNegotiation,
  startRoundContractNegotiation,
  submitRoundContractOffer,
} from "../../src/game/season/round-flow";

describe("contract negotiations", () => {
  it("derives negotiation power from team authority and character leverage", () => {
    const power = calculateNegotiationPower(
      demoState,
      "contract_moretti_2026",
    );

    expect(power.teamPower).toBeGreaterThan(0);
    expect(power.characterPower).toBeGreaterThan(0);
    expect(power.teamPower).toBeGreaterThan(power.characterPower);
    expect(power.delta).toBeCloseTo(
      power.teamPower - power.characterPower,
      1,
    );
  });

  it("builds a character demand above the current star-driver deal", () => {
    const session = startContractNegotiation(
      demoState,
      "contract_moretti_2026",
      24,
    );

    expect(session.status).toBe("OPEN");
    expect(session.characterDemand.salaryMillionsPerSeason).toBeGreaterThan(32);
    expect(session.characterDemand.extensionRounds).toBeGreaterThanOrEqual(24);
  });

  it("turns a firm offer into a counteroffer instead of an automatic deal", () => {
    const session = startContractNegotiation(
      demoState,
      "contract_moretti_2026",
      24,
    );
    const offer = createNegotiationOffer(session, "FIRM");
    const result = submitNegotiationOffer(
      demoState,
      session,
      offer,
      24,
    );

    expect(result.session.status).toBe("COUNTERED");
    expect(result.session.counterOffer).not.toBeNull();
    expect(result.session.history.map((entry) => entry.by)).toEqual([
      "TEAM",
      "CHARACTER",
    ]);
  });

  it("lets the team accept a character counteroffer and persists the renewal", () => {
    const state = structuredClone(demoState);
    const keller = state.characters.find(
      (character) => character.id === "char_keller",
    );
    if (!keller) throw new Error("Missing Keller");
    keller.career.transferInterest = 70;

    const session = startContractNegotiation(
      state,
      "contract_keller_2026",
      24,
    );
    const weakOffer = {
      salaryMillionsPerSeason: 7,
      guaranteedSalaryMillions: 12,
      extensionRounds: 12,
      releaseClauseMillions: null,
      performanceBonusMillions: 0.25,
    };
    const countered = submitNegotiationOffer(
      state,
      session,
      weakOffer,
      24,
    );

    expect(countered.session.status).toBe("COUNTERED");
    expect(countered.session.counterOffer?.releaseClauseMillions).not.toBeNull();

    const accepted = acceptNegotiationCounter(
      countered.political,
      countered.session,
      24,
    );
    const contract = accepted.political.contracts.find(
      (item) => item.id === "contract_keller_2026",
    );

    expect(accepted.session.status).toBe("ACCEPTED");
    expect(contract?.endRound).toBeGreaterThan(26);
    expect(
      contract?.releaseClauses.some(
        (clause) => clause.id === "release_char_keller_renewal",
      ),
    ).toBe(true);
    expect(accepted.session.followUpIssueDefinitionIds).toContain(
      "issue_contract_release_precedent",
    );
  });

  it("stalls after three rejected team offers", () => {
    const session = startContractNegotiation(
      demoState,
      "contract_moretti_2026",
      24,
    );
    const weakOffer = {
      salaryMillionsPerSeason: 20,
      guaranteedSalaryMillions: 30,
      extensionRounds: 12,
      releaseClauseMillions: null,
      performanceBonusMillions: 0.2,
    };

    const first = submitNegotiationOffer(
      demoState,
      session,
      weakOffer,
      24,
    );
    const second = submitNegotiationOffer(
      first.political,
      first.session,
      weakOffer,
      24,
    );
    const third = submitNegotiationOffer(
      second.political,
      second.session,
      weakOffer,
      24,
    );

    expect(first.session.status).toBe("COUNTERED");
    expect(second.session.status).toBe("COUNTERED");
    expect(third.session.status).toBe("STALLED");
    expect(third.session.followUpIssueDefinitionIds).toEqual(
      expect.arrayContaining([
        "issue_contract_negotiation_stall",
        "issue_contract_failed_owner_reaction",
        "issue_contract_failed_sponsor_reaction",
        "issue_contract_failed_staff_reaction",
      ]),
    );
  });

  it("adds a follow-up issue when the player walks away from talks", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 24);
    flow = startRoundContractNegotiation(flow, "contract_moretti_2026");
    const negotiation = flow.negotiations[0];

    flow = rejectRoundContractNegotiation(
      flow,
      negotiation.id,
      demoIssueDefinitions,
    );

    expect(flow.negotiations[0].status).toBe("REJECTED");
    expect(
      getOpenIssues(flow).some(
        (issue) =>
          issue.definitionId === "issue_contract_negotiation_stall" &&
          issue.parentIssueId === negotiation.id,
      ),
    ).toBe(true);
  });


  it("creates owner sponsor and staff fallout for an accepted hard deal", () => {
    const session = startContractNegotiation(
      demoState,
      "contract_moretti_2026",
      24,
    );
    const accepted = submitNegotiationOffer(
      demoState,
      session,
      session.characterDemand,
      24,
      "FIRM",
    );

    expect(accepted.session.status).toBe("ACCEPTED");
    expect(accepted.session.followUpIssueDefinitionIds).toEqual(
      expect.arrayContaining([
        "issue_contract_hard_owner_reaction",
        "issue_contract_hard_sponsor_reaction",
        "issue_contract_hard_staff_reaction",
      ]),
    );
  });

  it("creates owner sponsor and staff fallout for an accepted generous deal", () => {
    const session = startContractNegotiation(
      demoState,
      "contract_moretti_2026",
      24,
    );
    const offer = createNegotiationOffer(session, "GENEROUS");
    const accepted = submitNegotiationOffer(
      demoState,
      session,
      offer,
      24,
      "GENEROUS",
    );

    expect(accepted.session.status).toBe("ACCEPTED");
    expect(accepted.session.followUpIssueDefinitionIds).toEqual(
      expect.arrayContaining([
        "issue_contract_generous_owner_reaction",
        "issue_contract_generous_sponsor_reaction",
        "issue_contract_generous_staff_reaction",
      ]),
    );
  });

  it("adds all failed-talk power-center reactions to the inbox", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 24);
    flow = startRoundContractNegotiation(flow, "contract_moretti_2026");
    const negotiation = flow.negotiations[0];

    flow = rejectRoundContractNegotiation(
      flow,
      negotiation.id,
      demoIssueDefinitions,
    );

    const openDefinitions = getOpenIssues(flow).map(
      (issue) => issue.definitionId,
    );

    expect(openDefinitions).toEqual(
      expect.arrayContaining([
        "issue_contract_negotiation_stall",
        "issue_contract_failed_owner_reaction",
        "issue_contract_failed_sponsor_reaction",
        "issue_contract_failed_staff_reaction",
      ]),
    );
  });

  it("supports a playable team offer through the round-flow facade", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 24);
    flow = startRoundContractNegotiation(flow, "contract_moretti_2026");

    flow = submitRoundContractOffer(
      flow,
      flow.negotiations[0].id,
      "FIRM",
      demoIssueDefinitions,
    );

    expect(flow.negotiations[0].status).toBe("COUNTERED");
  });
});
