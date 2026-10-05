import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Vorstand & KarrierePanel } from "../../src/components/political/Vorstand & KarrierePanel";
import { RoundEventsPanel } from "../../src/components/political/RoundEventsPanel";
import { MotorsportWorldPanel } from "../../src/components/political/MotorsportWorldPanel";
import { MotorsportGame } from "../../src/components/political/MotorsportGame";
import Home from "../../src/app/page";
import { InboxIssuesPanel } from "../../src/components/political/InboxIssuesPanel";
import { PeoplePowerCentersPanel } from "../../src/components/political/PeoplePowerCentersPanel";
import { PoliticalConflictsPanel } from "../../src/components/political/PoliticalConflictsPanel";
import { createVorstand & KarriereFlow, reviewSeason } from "../../src/game/career/career";
import { advanceActors } from "../../src/game/career/actors";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";
import { createWorld } from "../../src/game/world/world";

describe("career HQ rendering", () => {
  it("renders market offers, development, race tables and actionable actor requests", () => {
    const flow = advanceActors(
      createVorstand & KarriereFlow(demoState, demoRoundEvents, 18),
    );
    for (const view of ["MARKET", "DEVELOPMENT", "RACING", "CAREER"] as const) {
      const html = renderToStaticMarkup(
        createElement(Vorstand & KarrierePanel, { flow, view, onAction: () => {} }),
      );
      expect(html).toContain("<button");
      if (view === "MARKET") {
        expect(html).toContain("Transfer zustimmen");
        expect(html).toContain("Vertragswarnungen");
        expect(html).toContain("Abwerbeversuch");
      }
      if (view === "RACING") expect(html).toContain("Teamwertung");
      if (view === "CAREER") expect(html).toContain("Frist R20");
    }
  });
  it("shows next season objectives and retains a readable dismissal report", () => {
    const flow = reviewSeason(createVorstand & KarriereFlow(demoState, [], 24));
    let html = renderToStaticMarkup(
      createElement(Vorstand & KarrierePanel, { flow, view: "CAREER", onAction: () => {} }),
    );
    expect(html).toContain("Nächste Saison");
    flow.career!.status = "DISMISSED";
    html = renderToStaticMarkup(
      createElement(Vorstand & KarrierePanel, { flow, view: "CAREER", onAction: () => {} }),
    );
    expect(html).toContain("Deine Amtszeit ist beendet");
    expect(html).not.toContain("Nächste Saison");
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
    expect(html).toContain("Zentrale");
    expect(html).toContain("Nächstes Rennwochenende");
    for (const text of [
      "Vorstand & Karriere",
      "Rennen",
      "Personal",
      "Technik",
      "Verträge",
      "Finanzen",
      "Runde 16 starten",
    ])
      expect(html).toContain(text);
  });
  it("renders extracted HQ workspaces independently", () => {
    const flow = createVorstand & KarriereFlow(demoState, demoRoundEvents, 15);

    const inbox = renderToStaticMarkup(
      createElement(InboxIssuesPanel, {
        flow,
        issueDefinitions: [],
        view: "INBOX",
        onIssueAction: () => {},
        onOpenVorstand & Karriere: () => {},
      }),
    );
    expect(inbox).toContain("Starte die nächste Runde");

    const issues = renderToStaticMarkup(
      createElement(InboxIssuesPanel, {
        flow,
        issueDefinitions: [],
        view: "ISSUES",
        onIssueAction: () => {},
        onOpenVorstand & Karriere: () => {},
      }),
    );
    expect(issues).toContain("Noch keine Themen erfasst");

    const people = renderToStaticMarkup(
      createElement(PeoplePowerCentersPanel, { flow, view: "PEOPLE" }),
    );
    expect(people).toContain("Dynamik");

    const centers = renderToStaticMarkup(
      createElement(PeoplePowerCentersPanel, { flow, view: "CENTERS" }),
    );
    expect(centers).toContain("Interner Einfluss");

    const conflicts = renderToStaticMarkup(
      createElement(PoliticalConflictsPanel, {
        flow,
        onConflictDecision: () => {},
        onOpenVorstand & Karriere: () => {},
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
    expect(html).toContain("Paddock-Nachrichten");
    expect(html).toContain("TEAM TREND");
    expect(html).toContain("SIGNING");
    expect(html).toContain("Transfer-Radar");
    expect(html).toContain("Vertragsbeobachtung");
    expect(html).toContain("Person ansehen");
    expect(html).toContain("Team ansehen");
    expect(html).toContain("Eilmeldung");
    expect(html).toContain(person.name);
  });

  it("renders the public website and separate career entry experience", () => {
    const website = renderToStaticMarkup(createElement(Home));
    expect(website).toContain("Führe dein Team.");
    expect(website).toContain("Gewinne die Meisterschaft.");
    expect(website).toContain('href="/game"');

    const game = renderToStaticMarkup(createElement(MotorsportGame));
    expect(game).toContain("KARRIERE STARTEN");
    expect(game).toContain("Rennserie auswählen");
    expect(game).toContain("Team auswählen");
  });

});
