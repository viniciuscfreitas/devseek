import { describe, expect, it } from "vitest";
import { calculateBaselineMatch } from "./scoring";

describe("calculateBaselineMatch", () => {
  it("returns 0 when there is no description", () => {
    expect(
      calculateBaselineMatch({
        requiredKeywords: ["react"],
        jobDescription: "",
      }),
    ).toBe(0);
  });

  it("computes required keyword coverage", () => {
    const score = calculateBaselineMatch({
      requiredKeywords: ["react", "next"],
      jobDescription: "We use React with Next.js for our frontend.",
    });

    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("reduces score when required keywords are missing", () => {
    const score = calculateBaselineMatch({
      requiredKeywords: ["react", "typescript"],
      jobDescription: "Looking for a developer with solid React experience.",
    });

    expect(score).toBeLessThan(70);
  });
});

