import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { MotorsportGame } from "../../src/components/political/MotorsportGame";
import { MotorsportWorldPanel } from "../../src/components/political/MotorsportWorldPanel";
import { CareerPanel } from "../../src/components/political/CareerPanel";
import { RoundEventsPanel } from "../../src/components/political/RoundEventsPanel";
import { createNewCareer } from "../../src/game/world/start";
import { SERIES } from "../../src/game/world/series";
describe("new career and large pool UI", () => {
  it("shows all nine choices and the new season start without requiring the old opening conflicts", () => {
    const html = renderToStaticMarkup(createElement(MotorsportGame));
    for (const s of SERIES) expect(html).toContain(s.name);
    expect(html).toContain("Start season from round 1");
    expect(html).toContain("666");
    expect(html).toContain("748");
    expect(html).toContain("106");
  });
  it("renders paginated recruitment with global search and source-series filters", () => {
    const flow = createNewCareer("F1"),
      html = renderToStaticMarkup(
        createElement(CareerPanel, {
          flow,
          view: "MARKET",
          onAction: () => {},
        }),
      );
    expect(html).toContain("Search driver and staff pool");
    expect(html).toContain("Source series");
    expect(html).toContain("Free agents only");
    expect(html).toContain("Page 1 /");
    expect((html.match(/Offer €/g) ?? []).length).toBeLessThanOrEqual(24);
  });
  it("shows actual team rosters, series standings and a paginated people database", () => {
    const world = createNewCareer("F3").career!.world!,
      html = renderToStaticMarkup(
        createElement(MotorsportWorldPanel, { world }),
      );
    expect(html).toContain("People database");
    expect(html).toContain("Driver championship");
    expect(html).toContain("Premio Academy");
    expect(html).toContain("Search world people");
  });
  it("opens HQ in preseason with round one and world navigation", () => {
    const flow = createNewCareer("INDYCAR"),
      html = renderToStaticMarkup(
        createElement(RoundEventsPanel, {
          initialFlow: flow,
          initialState: flow.political,
          events: [],
          issueDefinitions: [],
          afterRound: 0,
        }),
      );
    expect(html).toContain("Start round 1");
    expect(html).toContain("1 · Preseason");
    expect(html).toContain("Motorsport World");
  });
});
