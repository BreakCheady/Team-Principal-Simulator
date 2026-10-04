import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RacePanel } from "../../src/components/political/RacePanel";
import { RoundEventsPanel } from "../../src/components/political/RoundEventsPanel";
import { createNewCareer } from "../../src/game/world/start";
import { beginCareerWeekend } from "../../src/game/career/career";
import { advanceRace } from "../../src/game/racing/actions";
describe("race cockpit", () => {
  it("renders live strategy, rule sources and resume/save controls without advancing a race", () => {
    const flow = beginCareerWeekend(createNewCareer("GT4"), []),
      html = renderToStaticMarkup(
        createElement(RacePanel, { flow, onAction: () => {} }),
      );
    for (const text of [
      "Sporting-rule reference",
      "Practice run",
      "Run qualifying",
      "Live timing",
      "Starting tyres",
      "Fuel load",
      "Driver championship",
    ])
      expect(html).toContain(text);
    expect(flow.career!.races).toHaveLength(0);
    const hq = renderToStaticMarkup(
      createElement(RoundEventsPanel, {
        initialFlow: flow,
        initialState: flow.political,
        events: [],
        issueDefinitions: [],
        afterRound: 1,
      }),
    );
    expect(hq).toContain("Resume race");
    expect(hq).toContain("Save");
  });
  it("renders the completed classification, replay and explanations instead of hiding previous results", () => {
    const flow = advanceRace(
        beginCareerWeekend(createNewCareer("F3"), []),
        "FINISH",
      ),
      html = renderToStaticMarkup(
        createElement(RacePanel, { flow, onAction: () => {} }),
      );
    for (const text of [
      "Classification",
      "Event timeline",
      "Review race",
      "pit loss",
      "Replay",
    ])
      expect(html).toContain(text);
    expect(html).toContain("<svg");
  }, 15000);
});
