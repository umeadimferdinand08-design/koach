
import type {
  PersonalContext,
  PersonalFact,
  ContextCategory,
  InformationStatus,
} from "./types";

function getTimestamp(): string {
  return new Date().toISOString();
}

function createId(): string {
  return crypto.randomUUID();
}

// Create a new personal context for a user.
export function createPersonalContext(): PersonalContext {
  const now = getTimestamp();

  return {
    id: createId(),
    schemaVersion: "1.0",
    facts: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Add a new piece of information to a user's context.
export function addFact(
  context: PersonalContext,
  fact: Omit<
    PersonalFact,
    "id" | "recordedAt" | "lastUpdatedAt"
  >
): PersonalContext {
  const now = getTimestamp();

  const newFact: PersonalFact = {
    ...fact,
    id: createId(),
    recordedAt: now,
    lastUpdatedAt: now,
  };

  return {
    ...context,
    facts: [...context.facts, newFact],
    updatedAt: now,
  };
}

// Retrieve all information belonging to a category.
export function getFactsByCategory(
  context: PersonalContext,
  category: ContextCategory
): PersonalFact[] {
  return context.facts.filter(
    (fact) => fact.category === category
  );
}

// Retrieve information by its status.
export function getFactsByStatus(
  context: PersonalContext,
  status: InformationStatus
): PersonalFact[] {
  return context.facts.filter(
    (fact) => fact.status === status
  );
}

// Update a fact while preserving its original source.
export function updateFact(
  context: PersonalContext,
  factId: string,
  updates: Partial<
  Pick<
    PersonalFact,
    "key" | "value" | "status" | "confidence" | "source"
  >
>
): PersonalContext {
  const now = getTimestamp();

  return {
    ...context,
    facts: context.facts.map((fact) => {
      if (fact.id !== factId) {
        return fact;
      }

      return {
        ...fact,
        ...updates,
        ...(updates.status === "confirmed"
          ? { lastConfirmedAt: now }
          : {}),
        lastUpdatedAt: now,
      };
    }),
    updatedAt: now,
  };
}

// Confirm an observation after the user verifies it.
export function confirmFact(
  context: PersonalContext,
  factId: string
): PersonalContext {
  const now = getTimestamp();

  return {
    ...context,
    facts: context.facts.map((fact) => {
      if (fact.id !== factId) {
        return fact;
      }

      return {
        ...fact,
        status: "confirmed",
        lastConfirmedAt: now,
        lastUpdatedAt: now,
      };
    }),
    updatedAt: now,
  };
}
