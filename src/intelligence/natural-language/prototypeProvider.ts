
import type { InterpretationProvider } from "./responseInterpreter";
import type { ExtractedInformation } from "./types";

type ExtractionRule = {
  pattern: RegExp;
  category: ExtractedInformation["category"];
  key: string;
  transform?: (value: string) => unknown;
};

function formatTime(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, "").toUpperCase();

  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)?$/);

  if (!match) return value.trim();

  const hour = match[1];
  const minutes = match[2] ?? "00";
  const period = match[3] ?? "";

  return `${hour}:${minutes}${period ? ` ${period}` : ""}`;
}

function extractExplicitInformation(
  message: string
): ExtractedInformation[] {
  const rules: ExtractionRule[] = [
    {
      pattern: /(?:I usually go to bed|I usually sleep|I go to bed) at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      category: "routines",
      key: "usual_bedtime",
      transform: formatTime,
    },
    {
      pattern: /(?:I usually wake up|I wake up|I get up) at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      category: "routines",
      key: "usual_wake_time",
      transform: formatTime,
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
      pattern: /(?:I struggle to exercise|I struggle to work out|I find it difficult to exercise|I find it hard to exercise|I cannot find time to exercise|I don't have time to exercise|I don't have time to work out).*?(?:because\s+)?(?:I(?:'m| am) )?(?:always )?busy/i,
      category: "preferences",
      key: "main_activity_barrier",
      transform: () => "A busy schedule makes it difficult to exercise",
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

    const rawValue = match[1] ?? match[0];

    const value = rule.transform
      ? rule.transform(rawValue)
      : rawValue.trim();

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

function createSummary(
  extractedInformation: ExtractedInformation[]
): string {
  const wakeTime = extractedInformation.find(
    (item) => item.key === "usual_wake_time"
  );

  const bedtime = extractedInformation.find(
    (item) => item.key === "usual_bedtime"
  );

  const activityBarrier = extractedInformation.find(
    (item) => item.key === "main_activity_barrier"
  );

  const preferredActivity = extractedInformation.find(
    (item) => item.key === "preferred_activity"
  );

  if (wakeTime) {
    return `Thanks for sharing. I've recorded your usual wake-up time as ${wakeTime.value}. This will help me understand your daily routine better.`;
  }

  if (bedtime) {
    return `Thanks for sharing. I've recorded your usual bedtime as ${bedtime.value}. This will help me understand your sleep routine better.`;
  }

  if (activityBarrier) {
    return `It sounds like finding time is a challenge for your physical activity. I've noted this so future suggestions can take your schedule into account.`;
  }

  if (preferredActivity) {
    return `Good to know that you prefer ${String(preferredActivity.value).toLowerCase()}. I'll take that preference into account when exploring activities with you.`;
  }

  if (extractedInformation.length > 0) {
    return `Thanks for sharing. I've added ${extractedInformation.map((item) => String(item.value)).join(", ")} to the information I'm using to understand your routine.`;
  }

  return "I haven't identified a specific piece of profile information yet.";
}

function getFollowUpQuestion(
  message: string
): string {
  const normalized = message.trim().toLowerCase();

  if (
    /^(bad|not good|terrible|awful|poor|rough|not great)[.!?]*$/.test(normalized) ||
    /\b(i feel|feeling)\s+(bad|terrible|awful|down|low|stressed|frustrated|exhausted)\b/i.test(normalized)
  ) {
    return "I'm sorry to hear that. Would you like to tell me a little more about what's been difficult?";
  }

  if (/\b(tired|exhausted|low energy)\b/i.test(normalized)) {
    return "I'm sorry you're feeling that way. Has this been affecting your sleep, your daytime energy, or both?";
  }

  if (/\b(busy|no time|too much work)\b/i.test(normalized)) {
    return "It sounds like you have a lot going on. Is finding time for physical activity one of the things you're struggling with?";
  }

  if (/\b(sleep|sleeping|bedtime|waking)\b/i.test(normalized)) {
    return "Could you tell me a little more about your sleep routine, such as when you usually go to bed or wake up?";
  }

  if (/\b(exercise|workout|walking|activity|active)\b/i.test(normalized)) {
    return "What's the biggest thing that makes physical activity difficult for you?";
  }

  return "Could you tell me a little more about what has been happening with your sleep, activity or daily routine?";
}

export const prototypeInterpretationProvider: InterpretationProvider =
  async (message) => {
    const extractedInformation =
      extractExplicitInformation(message);

    const hasExtractedInformation =
      extractedInformation.length > 0;

    return {
      originalMessage: message,
      summary: hasExtractedInformation
        ? createSummary(extractedInformation)
        : getFollowUpQuestion(message),
      extractedInformation,
      unresolvedQuestions: [],
      requiresFollowUp: !hasExtractedInformation,
      interpretedAt: new Date().toISOString(),
    };
  };
