
import { describe, it, expect } from "vitest";

import {
  validateExtractedInformation,
} from "./factExtractor";

import type {
  ExtractedInformation,
} from "./types";

const originalMessage =
  "Work has been keeping me busy. I've been getting home late.";

const validInformation: ExtractedInformation = {
  category: "schedule",
  key: "late_arrival",
  value: "Getting home late",
  supportingText: "I've been getting home late.",
  interpretationType: "explicit",
  confidence: 1,
  requiresConfirmation: false,
  status: "confirmed",
};

describe("Natural Language Fact Extractor", () => {
  it("accepts valid explicitly stated information", () => {
    expect(() =>
      validateExtractedInformation(
        originalMessage,
        validInformation
      )
    ).not.toThrow();
  });

  it("rejects an empty original message", () => {
    expect(() =>
      validateExtractedInformation(
        "",
        validInformation
      )
    ).toThrow("Original message cannot be empty.");
  });

  it("rejects supporting text absent from the original message", () => {
    expect(() =>
      validateExtractedInformation(
        originalMessage,
        {
          ...validInformation,
          supportingText: "I exercise every morning.",
        }
      )
    ).toThrow(
      "Supporting text must exist in the original user message."
    );
  });

  it("rejects invalid confidence scores", () => {
    expect(() =>
      validateExtractedInformation(
        originalMessage,
        {
          ...validInformation,
          confidence: 1.5,
        }
      )
    ).toThrow(
      "Confidence must be a number between 0 and 1."
    );
  });

  it("rejects inferred information marked as confirmed", () => {
    expect(() =>
      validateExtractedInformation(
        originalMessage,
        {
          ...validInformation,
          interpretationType: "inferred",
          requiresConfirmation: true,
          status: "confirmed",
        }
      )
    ).toThrow(
      "Inferred information cannot be marked as confirmed."
    );
  });

  it("requires confirmation for inferred information", () => {
    expect(() =>
      validateExtractedInformation(
        originalMessage,
        {
          ...validInformation,
          interpretationType: "inferred",
          requiresConfirmation: false,
          status: "uncertain",
        }
      )
    ).toThrow(
      "Inferred information must require user confirmation."
    );
  });
});
