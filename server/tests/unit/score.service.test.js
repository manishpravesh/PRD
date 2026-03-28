import { describe, expect, it } from "vitest";
import { validateScorePayload } from "../../src/modules/scores/score.service.js";

describe("validateScorePayload", () => {
  it("accepts valid score payload", () => {
    const result = validateScorePayload({ score: 36, scoreDate: "2026-03-20" });

    expect(result).toEqual({
      score: 36,
      scoreDate: "2026-03-20",
    });
  });

  it("rejects out-of-range score", () => {
    expect(() =>
      validateScorePayload({ score: 0, scoreDate: "2026-03-20" }),
    ).toThrow("score must be an integer between 1 and 45");
  });

  it("rejects invalid score date", () => {
    expect(() =>
      validateScorePayload({ score: 20, scoreDate: "not-a-date" }),
    ).toThrow("scoreDate must be a valid date");
  });
});
