import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CareerPanel } from "../../src/components/political/CareerPanel";
import { RoundEventsPanel } from "../../src/components/political/RoundEventsPanel";
import { createCareerFlow, reviewSeason } from "../../src/game/career/career";
import { advanceActors } from "../../src/game/career/actors";
import { demoState } from "../../src/game/data/demo-state";
import { demoRoundEvents } from "../../src/game/data/demo-round-events";

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
      if (view === "MARKET") expect(html).toContain("Agree transfer");
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
});
