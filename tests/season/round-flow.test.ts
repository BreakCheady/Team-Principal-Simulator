import { describe, expect, it } from "vitest";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceRoundFlow,
  createRoundFlowState,
  getNextRound,
  getOpenIssues,
  resolveRoundConflict,
  resolveRoundIssue,
} from "../../src/game/season/round-flow";

describe("round flow", () => {
  it("schedules authored event rounds after the completed conflict sequence", () => {
    const flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    expect(flow.currentRound).toBe(15);
    expect(flow.scheduledRounds).toEqual([16, 17, 18, 19, 20]);
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

  it("finishes after the last authored round when issues are handled", () => {
    let flow = createRoundFlowState(demoState, demoRoundEvents, 15);

    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);
    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);

    const technical = getOpenIssues(flow)[0];
    flow = resolveRoundIssue(
      flow,
      technical.id,
      "mediate_technical_review",
      demoIssueDefinitions,
    );

    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);
    const media = getOpenIssues(flow)[0];
    flow = resolveRoundIssue(
      flow,
      media.id,
      "private_media_meeting",
      demoIssueDefinitions,
    );

    flow = advanceRoundFlow(flow, demoRoundEvents, demoIssueDefinitions);
    const contract = getOpenIssues(flow)[0];
    flow = resolveRoundIssue(
      flow,
      contract.id,
      "structured_contract_talks",
      demoIssueDefinitions,
    );

    expect(flow.currentRound).toBe(20);
    expect(flow.complete).toBe(true);
    expect(getNextRound(flow)).toBeNull();
    expect(flow.history.map((entry) => entry.round)).toEqual([
      16, 17, 18, 19, 20,
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
