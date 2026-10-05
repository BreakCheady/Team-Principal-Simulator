import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CareerPanel } from "../../src/components/political/CareerPanel";
import { RoundEventsPanel } from "../../src/components/political/RoundEventsPanel";
import { MotorsportWorldPanel } from "../../src/components/political/MotorsportWorldPanel";
import { MotorsportGame } from "../../src/components/political/MotorsportGame";
import Home from "../../src/app/page";
import { InboxIssuesPanel } from "../../src/components/political/InboxIssuesPanel";
import { PeoplePowerCentersPanel } from "../../src/components/political/PeoplePowerCentersPanel";
import { PoliticalConflictsPanel } from "../../src/components/political/PoliticalConflictsPanel";
import { createCareerFlow, reviewSeason } from "../../src/game/career/career";
import { advanceActors } from "../../src/game/career/actors";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { createWorld } from "../../src/game/world/world";

describe("career HQ rendering", () => {
  it("renders market offers, development, race tables and actionable actor requests", () => {
    const flow = advanceActors(
      createCareerFlow(demoState, demoRoundEvents, 18),
    );
    for (const view of ["MARKET", "DEVELOPMENT", "RACING", "CAREER"] as const) {
      const html = renderToStaticMarkup(
        createElement(CareerPanel, { flow, view, onAction: () => {} }),
      );
      expect(html).toContain("<button");
      if (view === "MARKET") {
        expect(html).toContain("Agree transfer");
        expect(html).toContain("Contract warnings");
        expect(html).toContain("Rival approach");
      }
      if (view === "RACING") expect(html).toContain("Team championship");
      if (view === "CAREER") expect(html).toContain("Deadline R20");
    }
  });
  it("shows next season objectives and retains a readable dismissal report", () => {
    const flow = reviewSeason(createCareerFlow(demoState, [], 24));
    let html = renderToStaticMarkup(
      createElement(CareerPanel, { flow, view: "CAREER", onAction: () => {} }),
    );
    expect(html).toContain("Next season");
    flow.career!.status = "DISMISSED";
    html = renderToStaticMarkup(
      createElement(CareerPanel, { flow, view: "CAREER", onAction: () => {} }),
    );
    expect(html).toContain("Your tenure has ended");
    expect(html).not.toContain("Next season");
  });
  it("opens the main HQ in career mode with all six systems discoverable", () => {
    const html = renderToStaticMarkup(
      createElement(RoundEventsPanel, {
        initialState: demoState,
        events: demoRoundEvents,
        issueDefinitions: [],
        afterRound: 15,
      }),
    );
    expect(html).toContain("HQ Overview");
    expect(html).toContain("Next race weekend");
    for (const text of [
      "Career",
      "Championship",
      "Transfer Market",
      "Development",
      "Contracts",
      "Finance",
      "Start round 16",
    ])
      expect(html).toContain(text);
  });
  it("renders extracted HQ workspaces independently", () => {
    const flow = createCareerFlow(demoState, demoRoundEvents, 15);

    const inbox = renderToStaticMarkup(
      createElement(InboxIssuesPanel, {
        flow,
        issueDefinitions: [],
        view: "INBOX",
        onIssueAction: () => {},
        onOpenCareer: () => {},
      }),
    );
    expect(inbox).toContain("Start the next round");

    const issues = renderToStaticMarkup(
      createElement(InboxIssuesPanel, {
        flow,
        issueDefinitions: [],
        view: "ISSUES",
        onIssueAction: () => {},
        onOpenCareer: () => {},
      }),
    );
    expect(issues).toContain("No issues recorded yet");

    const people = renderToStaticMarkup(
      createElement(PeoplePowerCentersPanel, { flow, view: "PEOPLE" }),
    );
    expect(people).toContain("Momentum");

    const centers = renderToStaticMarkup(
      createElement(PeoplePowerCentersPanel, { flow, view: "CENTERS" }),
    );
    expect(centers).toContain("Internal influence");

    const conflicts = renderToStaticMarkup(
      createElement(PoliticalConflictsPanel, {
        flow,
        onConflictDecision: () => {},
        onOpenCareer: () => {},
      }),
    );
    expect(conflicts.length).toBeGreaterThan(20);
  });

  it("renders paddock news from persistent world activity", () => {
    const world = createWorld("F1");
    const person = world.people.find((item) => item.role === "DRIVER")!;
    const team = world.teams.find((item) => item.seriesId === "F1")!;
    world.activity = [
      {
        id: "activity_test_signing",
        season: 1,
        seriesId: "F1",
        type: "SIGNING",
        personId: person.id,
        fromTeamId: null,
        toTeamId: team.id,
        headline: `${team.name} signs ${person.name}`,
        detail: `${person.name} joins ${team.name} for the new season.`,
      },
      {
        id: "activity_test_trend",
        season: 1,
        seriesId: "F1",
        type: "TEAM_TREND",
        personId: null,
        fromTeamId: team.id,
        toTeamId: team.id,
        headline: `${team.name} gains momentum`,
        detail: "Budget and reputation improve after a strong season.",
      },
    ];
    const html = renderToStaticMarkup(
      createElement(MotorsportWorldPanel, { world }),
    );
    expect(html).toContain("Paddock News");
    expect(html).toContain("TEAM TREND");
    expect(html).toContain("SIGNING");
    expect(html).toContain("Transfer Radar");
    expect(html).toContain("Contract Watch");
    expect(html).toContain("View person");
    expect(html).toContain("View team");
    expect(html).toContain("Breaking");
    expect(html).toContain(person.name);
  });

  it("renders the public website and separate career entry experience", () => {
    const website = renderToStaticMarkup(createElement(Home));
    expect(website).toContain("Win the race.");
    expect(website).toContain("Keep the team.");
    expect(website).toContain('href="/game"');

    const game = renderToStaticMarkup(createElement(MotorsportGame));
    expect(game).toContain("Choose your paddock.");
    expect(game).toContain("Choose series");
    expect(game).toContain("Choose team");
  });

});
