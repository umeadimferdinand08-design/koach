
import { describe, it, expect } from "vitest";
import { generateRecommendation } from "./recommendationEngine";
import type { RecommendationEngineInput } from "./types";
import type { PersonalFact } from "../personal-profile/types";
import type { DetectedPattern } from "../pattern-detection/types";

function createFact(
  key: string,
  value: string,
  status: PersonalFact["status"] = "confirmed",
  source: PersonalFact["source"] = "user_input",
  permissionRequired = false
): PersonalFact {
  const now = new Date().toISOString();

  return {
    id: `fact-${key}`,
    category: "behaviour",
    key,
    value,
    status,
    source,
    recordedAt: now,
    lastUpdatedAt: now,
    permissionRequired,
  };
}

function createPattern(
  status: DetectedPattern["status"] = "confirmed",
  evidenceFactIds: string[] = ["fact-current_activity_level"]
): DetectedPattern {
  return {
    id: "pattern-activity",
    category: "activity",
    title: "Activity pattern",
    description: "An activity pattern was identified.",
    status,
    confidence: "high",
    evidenceFactIds,
    evidenceStatuses: ["confirmed"],
    explanation: "Supporting activity evidence.",
    detectedAt: new Date().toISOString(),
  };
}

describe("Recommendation Engine", () => {
  it("requests more information when no usable context exists", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });

  it("generates an activity recommendation from activity context", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [
        createFact("current_activity_level", "Low"),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("recommended");
    expect(result.recommendation?.category).toBe("physical_activity");
  });

  it("generates a sleep recommendation from sleep context", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [
        createFact("usual_bedtime", "11:00 PM"),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("recommended");
    expect(result.recommendation?.category).toBe("sleep");
  });

  it("does not use simulated facts in Live Mode", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [
        createFact(
          "current_activity_level",
          "Low",
          "confirmed",
          "simulated"
        ),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });

  it("does not use derived facts as recommendation evidence", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [
        createFact(
          "current_activity_level",
          "Low",
          "confirmed",
          "derived"
        ),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });

  it("does not use permission-required facts", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [],
      facts: [
        createFact(
          "current_activity_level",
          "Low",
          "confirmed",
          "user_input",
          true
        ),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });

  it("does not use dismissed patterns", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [
        createPattern("dismissed"),
      ],
      facts: [],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });

  it("does not use patterns supported by ineligible facts", () => {
    const input: RecommendationEngineInput = {
      mode: "live",
      patterns: [
        createPattern("confirmed"),
      ],
      facts: [
        createFact(
          "current_activity_level",
          "Low",
          "confirmed",
          "derived"
        ),
      ],
    };

    const result = generateRecommendation(input);

    expect(result.decision).toBe("needs_more_information");
    expect(result.recommendation).toBeNull();
  });
});
