import { describe, expect, it } from "vitest";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceRoundFlow,
  createRoundFlowState,
  exerciseRoundContractOption,
  startRoundContractNegotiation,
  getNextRound,
  getOpenIssues,
  resolveRoundConflict,
  resolveRoundIssue,
} from "../../src/game/season/round-flow";
import { encodeSave, decodeSave } from "../../src/game/save/save-game";
import type { RoundFlowState } from "../../src/game/season/round-flow";

describe("round flow", () => {
  it("persists event-earned bonuses and an exercised team option through save/load", () => {
    const initial = createRoundFlowState(demoState, demoRoundEvents, 21);
    const flow = advanceRoundFlow(initial, demoRoundEvents);
    const original = structuredClone(flow);
    const contract = flow.political.contracts[0];
    const extended = exerciseRoundContractOption(flow, contract.id, contract.options[0].id);
    const restored = decodeSave<RoundFlowState>(encodeSave("ROUND_FLOW", extended), "ROUND_FLOW").state;
    expect(flow).toEqual(original);
    expect(restored.political.contracts[0].endRound).toBe(50);
    expect(restored.political.contracts[0].salaryMillionsPerSeason).toBe(34.56);
    expect(restored.political.contracts[0].earnedBonusesMillions).toBe(2.5);
    expect(restored.history[0].events[1].contractTriggers).toHaveLength(3);
    expect(restored.currentRound).toBe(22);
    expect(restored.history).toEqual(flow.history);
    expect(() => exerciseRoundContractOption(restored, contract.id, contract.options[0].id))
      .toThrow(/already exercised/);
  });

  it.each(["CHARACTER", "MUTUAL"] as const)("does not let the team unilaterally exercise a %s option", (holder) => {
    const flow = advanceRoundFlow(createRoundFlowState(demoState, demoRoundEvents, 21), demoRoundEvents);
    const contract = flow.political.contracts[0];
    contract.options[0].holder = holder;
    expect(() => exerciseRoundContractOption(flow, contract.id, contract.options[0].id))
      .toThrow(/team-held options/);
  });

  it("requires renewal talks to finish before exercising a team option", () => {
    let flow = advanceRoundFlow(createRoundFlowState(demoState, demoRoundEvents, 21), demoRoundEvents);
    const contract = flow.political.contracts[0];
    flow = startRoundContractNegotiation(flow, contract.id);
    expect(() => exerciseRoundContractOption(flow, contract.id, contract.options[0].id))
      .toThrow(/Finish renewal talks/);
  });

  it("schedules authored event rounds after the completed conflict sequence", () => {
    const flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    expect(flow.currentRound).toBe(15);
    expect(flow.scheduledRounds).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 24]);
    expect(getNextRound(flow)).toBe(16);
    expect(flow.complete).toBe(false);
  });

  it("advances one round at a time and carries the changed PoliticalState", () => {
    const source = structuredClone(demoState);
    const initialSnapshot = structuredClone(source);
    const round16 = advanceRoundFlow(
      createRoundFlowState(source, demoRoundEvents, 15),
      demoRoundEvents,
      demoIssueDefinitions,
    );

    expect(source).toEqual(initialSnapshot);
    expect(round16.currentRound).toBe(16);
    expect(getNextRound(round16)).toBe(17);
    expect(round16.history).toHaveLength(1);
    expect(round16.history[0].events[0].type).toBe("RACE_RESULT");

    const keller = round16.political.characters.find(
      (character) => character.id === "char_keller",
    );
    expect(keller?.dynamic.momentum).toBe(6);
  });

  it("creates an inbox issue and blocks the next round until it is handled", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 17);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    expect(flow.currentRound).toBe(18);
    expect(getOpenIssues(flow)).toHaveLength(1);
    expect(flow.issues[0].definitionId).toBe("issue_upgrade_fallout");
    expect(() =>
      advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions),
    ).toThrow(/Open inbox issues/);

    flow = resolveRoundIssue(
      flow,
      flow.issues[0].id,
      "mediate_technical_review",
      demoIssueDefinitions,
    );

    expect(flow.issues[0].status).toBe("WATCHING");
    expect(() =>
      advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions),
    ).not.toThrow();
  });


  it("ages watched issues and unresolved conflicts when time advances", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 17);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    const technical = getOpenIssues(flow)[0];
    flow = resolveRoundIssue(
      flow,
      technical.id,
      "mediate_technical_review",
      demoIssueDefinitions,
    );

    const sourceConflict = flow.political.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );
    if (!sourceConflict) throw new Error("Missing driver status conflict");
    sourceConflict.status = "ACTIVE";
    const beforeExposure = sourceConflict.publicExposure;

    const beforeIssueEscalation = flow.issues[0].escalation;
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    const agedIssue = flow.issues[0];
    const agedConflict = flow.political.conflicts.find(
      (item) => item.id === "conflict_driver_status",
    );

    expect(agedIssue.escalation).toBeGreaterThan(beforeIssueEscalation);
    expect(agedIssue.lastUpdatedRound).toBe(19);
    expect(agedConflict?.publicExposure).toBeGreaterThan(beforeExposure);
  });

  it("escalates a media issue into a playable conflict", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 18);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    const issue = flow.issues.find(
      (item) => item.definitionId === "issue_media_pressure",
    );
    if (!issue) throw new Error("Missing media issue");

    flow = resolveRoundIssue(
      flow,
      issue.id,
      "public_media_rebuttal",
      demoIssueDefinitions,
    );

    const conflict = flow.political.conflicts.find(
      (item) => item.id === "conflict_moretti_media_pressure",
    );

    expect(conflict?.status).toBe("ACTIVE");

    flow = resolveRoundConflict(
      flow,
      "conflict_moretti_media_pressure",
      "contain_media_story",
    );

    expect(
      flow.political.conflicts.find(
        (item) => item.id === "conflict_moretti_media_pressure",
      )?.status,
    ).toBe("RESOLVED");
  });


  it("creates cross-power-center follow-up issues from player choices", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 20);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    const sporting = getOpenIssues(flow).find(
      (issue) => issue.definitionId === "issue_varga_sporting_control",
    );
    if (!sporting) throw new Error("Missing Varga sporting issue");

    flow = resolveRoundIssue(
      flow,
      sporting.id,
      "keep_personal_sporting_control",
      demoIssueDefinitions,
    );

    const ownerFollowUp = getOpenIssues(flow).find(
      (issue) => issue.definitionId === "issue_owner_governance_chain",
    );

    expect(ownerFollowUp?.parentIssueId).toBe(sporting.id);
    expect(ownerFollowUp?.initiatorCharacterId).toBe("char_laurent");
    expect(ownerFollowUp?.category).toBe("OWNER");
  });

  it("finishes after the last authored round when open issues are handled", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    while (!flow.complete) {
      while (getOpenIssues(flow).length > 0) {
        const issue = getOpenIssues(flow)[0];
        const definition = demoIssueDefinitions.find(
          (item) => item.id === issue.definitionId,
        );
        if (!definition) throw new Error("Missing issue definition");

        flow = resolveRoundIssue(
          flow,
          issue.id,
          definition.actions[0].id,
          demoIssueDefinitions,
        );
      }

      flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);
    }

    while (getOpenIssues(flow).length > 0) {
      const issue = getOpenIssues(flow)[0];
      const definition = demoIssueDefinitions.find(
        (item) => item.id === issue.definitionId,
      );
      if (!definition) throw new Error("Missing issue definition");

      flow = resolveRoundIssue(
        flow,
        issue.id,
        definition.actions[0].id,
        demoIssueDefinitions,
      );
    }

    expect(flow.currentRound).toBe(24);
    expect(flow.complete).toBe(true);
    expect(getNextRound(flow)).toBeNull();
    expect(flow.history.map((entry) => entry.round)).toEqual([
      16, 17, 18, 19, 20, 21, 22, 23, 24,
    ]);
    expect(() =>
      advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions),
    ).toThrow(/already complete/);
  });

  it("starts from the PoliticalState produced by prior player decisions", () => {
    const political = structuredClone(demoState);
    const moretti = political.characters.find(
      (character) => character.id === "char_moretti",
    );
    if (!moretti) throw new Error("Missing Moretti");

    moretti.dynamic.momentum = 20;

    const round16 = advanceRoundFlow(
      createRoundFlowState(political, demoRoundEvents, 15),
      demoRoundEvents,
      demoIssueDefinitions,
    );

    expect(
      round16.political.characters.find(
        (character) => character.id === "char_moretti",
      )?.dynamic.momentum,
    ).toBe(18);
  });
});
