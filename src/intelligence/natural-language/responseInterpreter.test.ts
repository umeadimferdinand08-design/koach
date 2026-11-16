
import { describe, it, expect, vi } from "vitest";

import {
  interpretUserMessage,
} from "./responseInterpreter";

import type {
  InterpretationResult,
} from "./types";

const message =
  "Work has been keeping me busy. I've been getting home late.";

const validResult: InterpretationResult = {
  originalMessage: message,
  summary: "The user has been getting home late due to work demands.",
  extractedInformation: [
    {
      category: "schedule",
      key: "late_arrival",
      value: "Getting home late",
      supportingText: "I've been getting home late.",
      interpretationType: "explicit",
      confidence: 1,
      requiresConfirmation: false,
      status: "confirmed",
    },
  ],
  unresolvedQuestions: [],
  requiresFollowUp: false,
  interpretedAt: new Date().toISOString(),
};

describe("Natural Language Response Interpreter", () => {
  it("returns a valid interpretation from the provider", async () => {
    const provider = vi.fn().mockResolvedValue(validResult);

    const result = await interpretUserMessage(message, provider);

    expect(result).toEqual(validResult);
    expect(provider).toHaveBeenCalledWith(message);
  });

  it("rejects an empty user message", async () => {
    const provider = vi.fn();

    await expect(
      interpretUserMessage("   ", provider)
    ).rejects.toThrow("User message cannot be empty.");

    expect(provider).not.toHaveBeenCalled();
  });

  it("rejects an interpretation that changes the original message", async () => {
    const provider = vi.fn().mockResolvedValue({
      ...validResult,
      originalMessage: "A different message",
    });

    await expect(
      interpretUserMessage(message, provider)
    ).rejects.toThrow(
      "Interpretation must preserve the original user message."
    );
  });

  it("rejects an empty interpretation summary", async () => {
    const provider = vi.fn().mockResolvedValue({
      ...validResult,
      summary: "   ",
    });

    await expect(
      interpretUserMessage(message, provider)
    ).rejects.toThrow(
      "Interpretation summary cannot be empty."
    );
  });

  it("rejects extracted information that is not an array", async () => {
    const provider = vi.fn().mockResolvedValue({
      ...validResult,
      extractedInformation: null,
    });

    await expect(
      interpretUserMessage(message, provider)
    ).rejects.toThrow(
      "Extracted information must be an array."
    );
  });

  it("rejects extracted information with invalid supporting text", async () => {
    const provider = vi.fn().mockResolvedValue({
      ...validResult,
      extractedInformation: [
        {
          ...validResult.extractedInformation[0],
          supportingText: "I exercise every morning.",
        },
      ],
    });

    await expect(
      interpretUserMessage(message, provider)
    ).rejects.toThrow(
      "Supporting text must exist in the original user message."
    );
  });
});
