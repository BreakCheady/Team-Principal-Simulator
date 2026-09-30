import { describe, expect, it } from "vitest";
import { demoIssueDefinitions } from "../../src/game/data/demo-issues";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { demoState } from "../../src/game/data/demo-state";
import {
  advanceWatchingIssue,
  calculateNpcPressure,
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

  it("lets a private response reduce media pressure without solving it for free", () => {
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

    expect(result.issue.status).toBe("WATCHING");
    expect(result.issue.escalation).toBeLessThan(55);
    expect(result.issue.escalation).toBeGreaterThan(25);
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


  it("normalizes npc pressure to a bounded 0-100 score", () => {
    const round = processRound(demoState, 19, demoRoundEvents);
    const issue = createIssuesFromEvents(
      19,
      round.events,
      demoIssueDefinitions,
    )[0];
    const definition = demoIssueDefinitions.find(
      (item) => item.id === issue.definitionId,
    );
    if (!definition) throw new Error("Missing issue definition");

    const pressure = calculateNpcPressure(round.nextState, definition, issue);

    expect(pressure).toBeGreaterThanOrEqual(0);
    expect(pressure).toBeLessThanOrEqual(100);
    expect(pressure).toBeGreaterThan(45);
    expect(pressure).toBeLessThan(85);
  });

  it("ages watched issues and gives the npc another response next round", () => {
    const round = processRound(demoState, 18, demoRoundEvents);
    const issue = createIssuesFromEvents(
      18,
      round.events,
      demoIssueDefinitions,
    )[0];
    const handled = resolveIssueAction(
      round.nextState,
      issue,
      demoIssueDefinitions,
      "mediate_technical_review",
    );

    const aged = advanceWatchingIssue(
      handled.political,
      handled.issue,
      demoIssueDefinitions,
      19,
    );

    expect(aged.issue.lastUpdatedRound).toBe(19);
    expect(aged.issue.npcActions.length).toBe(2);
    expect(aged.issue.escalation).toBeGreaterThan(handled.issue.escalation);
  });


  it("creates issues for all v0.4 power-center events", () => {
    const expectations = [
      [21, "SPORTING", "char_varga"],
      [22, "OWNER", "char_laurent"],
      [23, "SPONSOR", "char_salazar"],
      [24, "STAFF", "char_bellini"],
    ] as const;

    for (const [roundNumber, category, initiator] of expectations) {
      const round = processRound(demoState, roundNumber, demoRoundEvents);
      const issues = createIssuesFromEvents(
        roundNumber,
        round.events,
        demoIssueDefinitions,
      );

      expect(issues).toHaveLength(1);
      expect(issues[0].category).toBe(category);
      expect(issues[0].initiatorCharacterId).toBe(initiator);
    }
  });


  it("keeps contract fallout reactions as three-way political decisions", () => {
    const falloutIds = [
      "issue_contract_failed_owner_reaction",
      "issue_contract_failed_sponsor_reaction",
      "issue_contract_failed_staff_reaction",
      "issue_contract_hard_owner_reaction",
      "issue_contract_hard_sponsor_reaction",
      "issue_contract_hard_staff_reaction",
      "issue_contract_generous_owner_reaction",
      "issue_contract_generous_sponsor_reaction",
      "issue_contract_generous_staff_reaction",
    ];

    for (const id of falloutIds) {
      const definition = demoIssueDefinitions.find((item) => item.id === id);
      if (!definition) throw new Error(`Missing fallout issue ${id}`);

      expect(definition.actions).toHaveLength(3);
      expect(
        definition.actions.every(
          (action) => (action.consequenceHints?.length ?? 0) >= 3,
        ),
      ).toBe(true);

      const escalationProfiles = new Set(
        definition.actions.map((action) =>
          Math.sign(action.escalationDelta),
        ),
      );
      expect(escalationProfiles.size).toBeGreaterThan(1);

      const effectProfiles = new Set(
        definition.actions.map((action) =>
          action.effects
            .map((effect) => effect.type)
            .sort()
            .join("|"),
        ),
      );
      expect(effectProfiles.size).toBeGreaterThan(1);
    }
  });

  it("applies materially different owner fallout choices", () => {
    const definition = demoIssueDefinitions.find(
      (item) => item.id === "issue_contract_failed_owner_reaction",
    );
    if (!definition) throw new Error("Missing failed owner reaction");

    const issue = {
      id: "test_failed_owner",
      definitionId: definition.id,
      sourceEventId: "test",
      parentIssueId: null,
      title: definition.title,
      summary: definition.summary,
      category: definition.category,
      initiatorCharacterId: definition.initiatorCharacterId,
      round: 24,
      status: "OPEN" as const,
      escalation: definition.baseEscalation,
      selectedActionId: null,
      npcActions: [],
      spawnedConflictId: null,
      lastUpdatedRound: 24,
    };

    const contingency = resolveIssueAction(
      demoState,
      issue,
      demoIssueDefinitions,
      "build_retention_contingency",
    );
    const hardLine = resolveIssueAction(
      demoState,
      issue,
      demoIssueDefinitions,
      "reject_owner_retention_pressure",
    );

    const contingencyRelationship = contingency.political.relationships.find(
      (relationship) => relationship.id === "rel_laurent_hartmann",
    );
    const hardLineRelationship = hardLine.political.relationships.find(
      (relationship) => relationship.id === "rel_laurent_hartmann",
    );
    const contingencyHartmann = contingency.political.characters.find(
      (character) => character.id === "char_hartmann",
    );
    const hardLineHartmann = hardLine.political.characters.find(
      (character) => character.id === "char_hartmann",
    );

    expect(contingency.issue.escalation).toBeLessThan(hardLine.issue.escalation);
    expect(contingencyRelationship?.trust).toBeGreaterThan(
      hardLineRelationship?.trust ?? 0,
    );
    expect(hardLineRelationship?.resentment).toBeGreaterThan(
      contingencyRelationship?.resentment ?? 0,
    );
    expect(hardLineHartmann?.dynamic.momentum).toBeGreaterThan(
      contingencyHartmann?.dynamic.momentum ?? 0,
    );
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
