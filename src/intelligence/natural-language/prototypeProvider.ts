
import type { InterpretationProvider } from "./responseInterpreter";
import type { ExtractedInformation } from "./types";

function extractExplicitInformation(
  message: string
): ExtractedInformation[] {
  const rules: Array<{
    pattern: RegExp;
    category: ExtractedInformation["category"];
    key: string;
    transform?: (value: string) => unknown;
  }> = [
    {
      pattern: /I usually go to bed at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      category: "routines",
      key: "usual_bedtime",
    },
    {
      pattern: /I usually wake up at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      category: "routines",
      key: "usual_wake_time",
    },
    {
      pattern: /I prefer (walking|running|cycling|swimming|yoga)/i,
      category: "preferences",
      key: "preferred_activity",
      transform: (value) =>
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    {
      pattern: /I exercise (\d+)\s+days?\s+(?:a|per)\s+week/i,
      category: "behaviour",
      key: "weekly_exercise_days",
    },
    {
      pattern: /I am mostly sitting during (?:the )?day/i,
      category: "behaviour",
      key: "current_activity_level",
      transform: () => "Mostly sitting",
    },
    {
      pattern: /I am lightly active/i,
      category: "behaviour",
      key: "current_activity_level",
      transform: () => "Lightly active",
    },
    {
      pattern: /I am moderately active/i,
      category: "behaviour",
      key: "current_activity_level",
      transform: () => "Moderately active",
    },
    {
      pattern: /I am very active/i,
      category: "behaviour",
      key: "current_activity_level",
      transform: () => "Very active",
    },
    {
      pattern: /my biggest challenge is (.+?)(?:[.!?]|$)/i,
      category: "preferences",
      key: "main_activity_barrier",
    },
  ];

  const extracted: ExtractedInformation[] = [];

  for (const rule of rules) {
    const match = message.match(rule.pattern);

    if (!match) continue;

    const value = rule.transform
      ? rule.transform(match[1] ?? match[0])
      : (match[1] ?? match[0]).trim();

    extracted.push({
      category: rule.category,
      key: rule.key,
      value,
      supportingText: match[0],
      interpretationType: "explicit",
      confidence: 1,
      requiresConfirmation: false,
      status: "confirmed",
    });
  }

  return extracted;
}

export const prototypeInterpretationProvider: InterpretationProvider =
  async (message) => {
    const extractedInformation =
      extractExplicitInformation(message);

    return {
      originalMessage: message,
      summary: extractedInformation.length > 0
        ? "I identified information you explicitly shared."
        : "I couldn't confidently identify profile information in that message.",
      extractedInformation,
      unresolvedQuestions: extractedInformation.length === 0
        ? ["Could you tell me a little more about your sleep or activity routine?"]
        : [],
      requiresFollowUp: extractedInformation.length === 0,
      interpretedAt: new Date().toISOString(),
    };
  };
