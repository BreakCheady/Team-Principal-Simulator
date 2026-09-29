import { describe, expect, it } from "vitest";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  createIssuesFromEvents,
  resolveIssueAction,
} from "../../src/game/issues/issues";
import { processRound } from "../../src/game/season/round-events";

describe("issue engine", () => {
  it("creates an inbox issue from an authored round event", () => {
    const round = processRound(demoState, 19, demoRoundEvents);
    const issues = createIssuesFromEvents(
      19,
      round.events,
      demoIssueDefinitions,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].definitionId).toBe("issue_media_pressure");
    expect(issues[0].status).toBe("OPEN");
    expect(issues[0].escalation).toBe(55);
  });

  it("lets a strong private response contain a media issue", () => {
    const round = processRound(demoState, 19, demoRoundEvents);
    const issue = createIssuesFromEvents(
      19,
      round.events,
      demoIssueDefinitions,
    )[0];

    const result = resolveIssueAction(
      round.nextState,
      issue,
      demoIssueDefinitions,
      "private_media_meeting",
    );

    expect(result.issue.status).toBe("RESOLVED");
    expect(result.issue.escalation).toBeLessThanOrEqual(25);
    expect(result.issue.npcActions).toHaveLength(1);
    expect(result.spawnedConflictId).toBeNull();
  });

  it("lets a confrontational response escalate into a media conflict", () => {
    const round = processRound(demoState, 19, demoRoundEvents);
    const issue = createIssuesFromEvents(
      19,
      round.events,
      demoIssueDefinitions,
    )[0];

    const result = resolveIssueAction(
      round.nextState,
      issue,
      demoIssueDefinitions,
      "public_media_rebuttal",
    );

    expect(result.issue.status).toBe("ESCALATED");
    expect(result.issue.npcActions.at(-1)?.label).toBe("Escalates pressure");
    expect(result.spawnedConflictId).toBe("conflict_moretti_media_pressure");
    expect(
      result.political.conflicts.find(
        (conflict) => conflict.id === "conflict_moretti_media_pressure",
      )?.status,
    ).toBe("ACTIVE");
  });

  it("can leave a technical problem under observation without creating a conflict", () => {
    const round = processRound(demoState, 18, demoRoundEvents);
    const issue = createIssuesFromEvents(
      18,
      round.events,
      demoIssueDefinitions,
    )[0];

    const result = resolveIssueAction(
      round.nextState,
      issue,
      demoIssueDefinitions,
      "mediate_technical_review",
    );

    expect(result.issue.status).toBe("WATCHING");
    expect(result.spawnedConflictId).toBeNull();
  });

  it("applies issue actions without mutating the source political state", () => {
    const round = processRound(demoState, 19, demoRoundEvents);
    const source = structuredClone(round.nextState);
    const snapshot = structuredClone(source);
    const issue = createIssuesFromEvents(
      19,
      round.events,
      demoIssueDefinitions,
    )[0];

    resolveIssueAction(
      source,
      issue,
      demoIssueDefinitions,
      "private_media_meeting",
    );

    expect(source).toEqual(snapshot);
  });
});
