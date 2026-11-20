
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  generateDemoObservations,
} from "./intelligence/observations/demoDataGenerator";

import type {
  ObservationMode,
} from "./intelligence/observations/types";

import {
  detectHistoricalPatterns,
  detectCandidatePatterns,
} from "./intelligence/pattern-detection/patternDetection";

import {
  generateRecommendation,
} from "./intelligence/recommendation-engine/recommendationEngine";
import {
  createPersonalContext, addFact, updateFact,
} from "./intelligence/personal-profile/personalContext";

import type { PersonalContext } from "./intelligence/personal-profile/types";

import {
  interpretUserMessage,
} from "./intelligence/natural-language/responseInterpreter";

import {
  prototypeInterpretationProvider,
} from "./intelligence/natural-language/prototypeProvider";

import {
  integrateInterpretation,
} from "./intelligence/natural-language/contextIntegrator";

type Tab = "Home" | "My Goals" | "Insights" | "Data & Privacy";

type RecommendationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "modified";

  type ScheduledActivity = {
  id: string;
  title: string;
  durationMinutes: number;
  timing: string;
  location: string;
  status: "scheduled";
};

// Creates a clearly labelled demonstration profile.
function createDemoProfile(): PersonalContext {
  let context = createPersonalContext();

  context = addFact(context, {
    category: "goals",
    key: "primary_goal",
    value: "Build consistent exercise habits",
    status: "confirmed",
    source: "simulated",
    permissionRequired: false,
  });

  context = addFact(context, {
    category: "preferences",
    key: "preferred_activity",
    value: "Walking",
    status: "confirmed",
    source: "simulated",
    permissionRequired: false,
  });

  context = addFact(context, {
    category: "health",
    key: "activity_minutes",
    value: 32,
    status: "observed",
    source: "simulated",
    permissionRequired: true,
  });

  context = addFact(context, {
    category: "health",
    key: "sleep_hours",
    value: 7.2,
    status: "observed",
    source: "simulated",
    permissionRequired: true,
  });

  context = addFact(context, {
    category: "routines",
    key: "morning_activity_pattern",
    value: "Morning exercise may be difficult to accommodate",
    status: "observed",
    source: "simulated",
    confidence: 0.65,
    permissionRequired: false,
  });

  return context;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [observationMode, setObservationMode] =
    useState<ObservationMode>("demo");
  const [insightPeriod, setInsightPeriod] =
    useState<"7" | "3">("7");

  const demoObservations = useMemo(
    () => generateDemoObservations(),
    []
  );

  const historicalPatterns = useMemo(
    () =>
      detectHistoricalPatterns(
        demoObservations,
        observationMode
      ),
    [demoObservations, observationMode]
  );
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
  return localStorage.getItem("koach-onboarding-complete") === "true";
});

const [onboardingStep, setOnboardingStep] = useState(1);
const [personalisationStarted, setPersonalisationStarted] = useState(false);
const [personalisationStep, setPersonalisationStep] = useState(1);
const [currentActivityLevel, setCurrentActivityLevel] = useState("");
const [weeklyExerciseDays, setWeeklyExerciseDays] = useState("");
const [usualBedtime, setUsualBedtime] = useState("");
const [usualWakeTime, setUsualWakeTime] = useState("");
const [mainBarrier, setMainBarrier] = useState("");
const [exerciseEnvironment, setExerciseEnvironment] = useState("");


const [onboardingGoal, setOnboardingGoal] = useState("");
const [onboardingActivity, setOnboardingActivity] = useState("");
const [onboardingSleepGoal, setOnboardingSleepGoal] = useState("8");
  const [goalDraft, setGoalDraft] = useState("");
const [activityDraft, setActivityDraft] = useState("");
const [profileSaveMessage, setProfileSaveMessage] = useState("");

  const [personalContext, setPersonalContext] =
  useState<PersonalContext>(() => {
    try {
      const savedProfile = localStorage.getItem("koach-personal-context");

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as PersonalContext;

        if (
          parsed.schemaVersion === "1.0" &&
          Array.isArray(parsed.facts)
        ) {
          return parsed;
        }
      }
    } catch {
      console.warn("Could not load saved Koach profile.");
    }

    return createDemoProfile();
  });

    const candidatePatterns = useMemo(
    () => detectCandidatePatterns(personalContext, observationMode),
    [personalContext, observationMode]
  );

  const allPatterns = useMemo(
    () => [...candidatePatterns, ...historicalPatterns],
    [candidatePatterns, historicalPatterns]
  );

  const insightDays = useMemo(() => {
  if (observationMode !== "demo") return [];

  const days = new Map<
    string,
    { steps?: number; bedtime?: string; wakeTime?: string }
  >();

  for (const observation of demoObservations) {
    const date = observation.observedAt.slice(0, 10);

    if (!days.has(date)) {
      days.set(date, {});
    }

    const day = days.get(date)!;

    if (
      observation.metric === "steps" &&
      typeof observation.value === "number"
    ) {
      day.steps = observation.value;
    }

    if (
      observation.metric === "bedtime" &&
      typeof observation.value === "string"
    ) {
      day.bedtime = observation.value;
    }

    if (
      observation.metric === "wake_time" &&
      typeof observation.value === "string"
    ) {
      day.wakeTime = observation.value;
    }
  }

  return Array.from(days.entries())
    .map(([date, day]) => {
      let sleepHours: number | null = null;

      if (day.bedtime && day.wakeTime) {
        const [bedHour, bedMinute] = day.bedtime.split(":").map(Number);
        const [wakeHour, wakeMinute] = day.wakeTime.split(":").map(Number);

        const bedtimeMinutes = bedHour * 60 + bedMinute;
        let wakeMinutes = wakeHour * 60 + wakeMinute;

        if (wakeMinutes <= bedtimeMinutes) {
          wakeMinutes += 24 * 60;
        }

        sleepHours = Number(
          ((wakeMinutes - bedtimeMinutes) / 60).toFixed(1)
        );
      }

      return {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString("en", {
          weekday: "short",
        }),
        steps: day.steps ?? 0,
        sleepHours,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}, [demoObservations, observationMode]);

const visibleInsightDays = insightDays.slice(
  insightPeriod === "7" ? -7 : -3
);

const maxSteps = Math.max(
  ...visibleInsightDays.map((day) => day.steps),
  1
);

  const recommendationResult = useMemo(
    () =>
      generateRecommendation({
        mode: observationMode,
        patterns: allPatterns,
        facts: personalContext.facts,
      }),
    [observationMode, allPatterns, personalContext]
  );

  const currentRecommendation =
    recommendationResult.recommendation;


type CoachMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: string;
};

const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(() => {
  try {
    const saved = localStorage.getItem("koach-conversation");
    return saved ? JSON.parse(saved) as CoachMessage[] : [];
  } catch {
    return [];
  }
});

const [coachInput, setCoachInput] = useState("");
const [coachLoading, setCoachLoading] = useState(false);
const [coachError, setCoachError] = useState("");

  useEffect(() => {
  localStorage.setItem(
    "koach-personal-context",
    JSON.stringify(personalContext)
  );
}, [personalContext]);

useEffect(() => {
  localStorage.setItem(
    "koach-conversation",
    JSON.stringify(coachMessages)
  );
}, [coachMessages]);


  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>("pending");

    const [showRecommendationReason, setShowRecommendationReason] =
  useState(false);

    const [scheduledActivities, setScheduledActivities] =
  useState<ScheduledActivity[]>(() => {
    try {
      const saved = localStorage.getItem("koach-scheduled-activities");
      return saved ? JSON.parse(saved) as ScheduledActivity[] : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
  localStorage.setItem(
    "koach-scheduled-activities",
    JSON.stringify(scheduledActivities)
  );
}, [scheduledActivities]);

  const tabs: Tab[] = ["Home", "My Goals", "Insights", "Data & Privacy"];

  // Read values from the Personal Context Model.
  function getProfileValue(key: string, fallback: string): string {
  const eligibleFacts = personalContext.facts.filter((fact) => {
    if (fact.key !== key) return false;

    // User-provided information is valid in both modes.
    if (fact.source === "user_input") return true;

    // Simulated information is available only in Demo Mode.
    if (fact.source === "simulated") {
      return observationMode === "demo";
    }

    // Derived information is excluded until its source lineage
    // can be independently verified.
    if (fact.source === "derived") return false;

    // Other non-simulated sources are eligible in Live Mode.
    return observationMode === "live";
  });

  // Prefer user-provided information over simulated information.
  const fact =
    eligibleFacts.find((item) => item.source === "user_input") ??
    eligibleFacts[0];

  if (!fact) return fallback;

const storedValue = fact.value;

if (
  storedValue &&
  typeof storedValue === "object" &&
  "extractedValue" in storedValue
) {
  return String(storedValue.extractedValue);
}

return String(storedValue);
}


async function sendCoachMessage() {
  const message = coachInput.trim();

  if (!message || coachLoading) return;

  const userMessage: CoachMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: message,
    timestamp: new Date().toISOString(),
  };

  setCoachMessages((current) => [...current, userMessage]);
  setCoachInput("");
  setCoachLoading(true);
  setCoachError("");

  try {
    const interpretation = await interpretUserMessage(
      message,
      prototypeInterpretationProvider
    );

    setPersonalContext((currentContext) =>
      integrateInterpretation(currentContext, interpretation)
    );

    const responseText = interpretation.summary;
    const coachMessage: CoachMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      text: responseText,
      timestamp: new Date().toISOString(),
    };

    setCoachMessages((current) => [...current, coachMessage]);
  } catch (error) {
    console.error("Koach message processing failed:", error);
    setCoachError(
      "I couldn't process that message. Please try again."
    );
  } finally {
    setCoachLoading(false);
  }
}


  const primaryGoal = getProfileValue(
    "primary_goal",
    "No goal added yet"
  );

  const preferredActivity = getProfileValue(
    "preferred_activity",
    "Not specified"
  );
  useEffect(() => {
  setGoalDraft(primaryGoal);
  setActivityDraft(preferredActivity);
}, [primaryGoal, preferredActivity]);

  const activityMinutes = getProfileValue(
  "activity_minutes",
  "Not connected yet"
);

const sleepHours = getProfileValue(
  "sleep_hours",
  "Not connected yet"
);

  

  
  function saveProfileChanges() {
  const trimmedGoal = goalDraft.trim();
  const trimmedActivity = activityDraft.trim();

  if (!trimmedGoal || !trimmedActivity) {
    setProfileSaveMessage("Please fill in both fields.");
    return;
  }

  setPersonalContext((currentContext) => {
    let updatedContext = currentContext;

    const existingGoal = updatedContext.facts.find(
      (fact) => fact.key === "primary_goal"
    );

    if (existingGoal) {
      updatedContext = updateFact(updatedContext, existingGoal.id, {
  value: trimmedGoal,
  status: "confirmed",
  source: "user_input",
});
    } else {
      updatedContext = addFact(updatedContext, {
        category: "goals",
        key: "primary_goal",
        value: trimmedGoal,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    const existingActivity = updatedContext.facts.find(
      (fact) => fact.key === "preferred_activity"
    );

    if (existingActivity) {
      updatedContext = updateFact(updatedContext, existingActivity.id, {
  value: trimmedActivity,
  status: "confirmed",
  source: "user_input",
});
    } else {
      updatedContext = addFact(updatedContext, {
        category: "preferences",
        key: "preferred_activity",
        value: trimmedActivity,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    return updatedContext;
  });

  setProfileSaveMessage("Your profile has been updated.");
}

function completeOnboarding() {
  const trimmedGoal = onboardingGoal.trim();
  const trimmedActivity = onboardingActivity.trim();
  const sleepGoal = Number(onboardingSleepGoal);

  if (!trimmedGoal || !trimmedActivity) {
    return;
  }

  if (!Number.isFinite(sleepGoal) || sleepGoal < 4 || sleepGoal > 12) {
    return;
  }

  setPersonalContext((currentContext) => {
    let updatedContext = currentContext;

    const goalFact = updatedContext.facts.find(
      (fact) => fact.key === "primary_goal"
    );

    if (goalFact) {
    updatedContext = updateFact(updatedContext, goalFact.id, {
    value: trimmedGoal,
    status: "confirmed",
    source: "user_input",
    });
    } else {
      updatedContext = addFact(updatedContext, {
        category: "goals",
        key: "primary_goal",
        value: trimmedGoal,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    const activityFact = updatedContext.facts.find(
      (fact) => fact.key === "preferred_activity"
    );

    if (activityFact) {
      updatedContext = updateFact(updatedContext, activityFact.id, {
  value: trimmedActivity,
  status: "confirmed",
  source: "user_input",
});
    } else {
      updatedContext = addFact(updatedContext, {
        category: "preferences",
        key: "preferred_activity",
        value: trimmedActivity,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    const sleepGoalFact = updatedContext.facts.find(
      (fact) => fact.key === "sleep_goal_hours"
    );

    if (sleepGoalFact) {
      updatedContext = updateFact(updatedContext, sleepGoalFact.id, {
  value: sleepGoal,
  status: "confirmed",
  source: "user_input",
});
    } else {
      updatedContext = addFact(updatedContext, {
        category: "goals",
        key: "sleep_goal_hours",
        value: sleepGoal,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    return updatedContext;
  });

  localStorage.setItem("koach-onboarding-complete", "true");
  setOnboardingComplete(true);
  setActiveTab("Home");
}

function savePersonalisationStep1() {
  setPersonalContext((currentContext) => {
    let updatedContext = currentContext;

    const answers = [
      {
        key: "current_activity_level",
        value: currentActivityLevel,
      },
      {
        key: "weekly_exercise_days",
        value: weeklyExerciseDays,
      },
    ];

    answers.forEach((answer) => {
      if (!answer.value) return;

      const existingFact = updatedContext.facts.find(
        (fact) => fact.key === answer.key
      );

      if (existingFact) {
        updatedContext = updateFact(updatedContext, existingFact.id, {
  value: answer.value,
  status: "confirmed",
  source: "user_input",
});
      } else {
        updatedContext = addFact(updatedContext, {
          category: "behaviour",
          key: answer.key,
          value: answer.value,
          status: "confirmed",
          source: "user_input",
          permissionRequired: false,
        });
      }
    });

    return updatedContext;
  });

  setPersonalisationStep(2);
}

function savePersonalisationStep2() {
  setPersonalContext((currentContext) => {
    let updatedContext = currentContext;

    const answers = [
      {
        key: "usual_bedtime",
        value: usualBedtime,
      },
      {
        key: "usual_wake_time",
        value: usualWakeTime,
      },
    ];

    answers.forEach((answer) => {
      if (!answer.value) return;

      const existingFact = updatedContext.facts.find(
        (fact) => fact.key === answer.key
      );

      if (existingFact) {
  updatedContext = updateFact(updatedContext, existingFact.id, {
    value: answer.value,
    status: "confirmed",
    source: "user_input",
  });
} else {
        updatedContext = addFact(updatedContext, {
          category: "routines",
          key: answer.key,
          value: answer.value,
          status: "confirmed",
          source: "user_input",
          permissionRequired: false,
        });
      }
    });

    return updatedContext;
  });

  setPersonalisationStep(3);
}

function savePersonalisationStep3() {
  setPersonalContext((currentContext) => {
    let updatedContext = currentContext;

    const answers = [
      {
        key: "main_activity_barrier",
        value: mainBarrier,
      },
      {
        key: "preferred_exercise_environment",
        value: exerciseEnvironment,
      },
    ];

    answers.forEach((answer) => {
      if (!answer.value) return;

      const existingFact = updatedContext.facts.find(
        (fact) => fact.key === answer.key
      );

     if (existingFact) {
  updatedContext = updateFact(updatedContext, existingFact.id, {
    value: answer.value,
    status: "confirmed",
    source: "user_input",
  });
} else {
        updatedContext = addFact(updatedContext, {
          category: "preferences",
          key: answer.key,
          value: answer.value,
          status: "confirmed",
          source: "user_input",
          permissionRequired: false,
        });
      }
    });

    return updatedContext;
  });

  setPersonalisationStarted(false);
  setPersonalisationStep(1);
  setActiveTab("Home");
}



  return (
    <>
      {!onboardingComplete && (
        <section className="onboarding-screen">
          <div className="onboarding-card">
            <div className="brand">
              koach<span>.</span>
            </div>

            <p>YOUR PERSONAL HEALTH COACH</p>

            <h1>Let's make progress that fits your life.</h1>

            <p>
              Before we build your routine, let's understand what matters
              to you.
            </p>

            <div className="onboarding-progress">
              Step {onboardingStep} of 3
            </div>

            {onboardingStep === 1 && (
  <div className="onboarding-form">
    <h2>What would you like to improve?</h2>

    <p>
      Choose a goal that matters to you. Koach will help you
      build a routine around your everyday life.
    </p>

    <label htmlFor="onboarding-goal">Your primary goal</label>

    <input
      id="onboarding-goal"
      type="text"
      value={onboardingGoal}
      onChange={(event) => setOnboardingGoal(event.target.value)}
      placeholder="e.g. Build consistent exercise habits"
    />

    <button
      className="primary-button"
      disabled={!onboardingGoal.trim()}
      onClick={() => setOnboardingStep(2)}
    >
      Continue
    </button>
  </div>
)}

{onboardingStep === 2 && (
  <div className="onboarding-form">
    <h2>Let's understand your preferences.</h2>

    <p>
      Your plan should fit the activities you enjoy and the
      amount of sleep you want to aim for.
    </p>

    <label htmlFor="onboarding-activity">
      What physical activity do you prefer?
    </label>

    <input
      id="onboarding-activity"
      type="text"
      value={onboardingActivity}
      onChange={(event) => setOnboardingActivity(event.target.value)}
      placeholder="e.g. Walking, cycling, dancing"
    />

    <label htmlFor="onboarding-sleep">
      How many hours of sleep would you like to aim for?
    </label>

    <input
      id="onboarding-sleep"
      type="number"
      min="4"
      max="12"
      step="0.5"
      value={onboardingSleepGoal}
      onChange={(event) => setOnboardingSleepGoal(event.target.value)}
    />

    <button
      className="secondary-button"
      onClick={() => setOnboardingStep(1)}
    >
      Back
    </button>

    <button
      className="primary-button"
      disabled={
        !onboardingActivity.trim() ||
        Number(onboardingSleepGoal) < 4 ||
        Number(onboardingSleepGoal) > 12
      }
      onClick={() => setOnboardingStep(3)}
    >
      Continue
    </button>
  </div>
)}

{onboardingStep === 3 && (
  <div className="onboarding-form">
    <h2>Koach learns your rhythm.</h2>

    <p>
      During your first 2–3 days, Koach will begin with the
      information you've provided and gradually learn about
      your routines.
    </p>

    <p>
      Any patterns it identifies will be presented for your
      review. Koach won't treat an assumption as a confirmed
      fact without your input.
    </p>

    <p>
      You remain in control of your information and choices.
    </p>

    <button
      className="secondary-button"
      onClick={() => setOnboardingStep(2)}
    >
      Back
    </button>

    <button
      className="primary-button"
      onClick={completeOnboarding}
    >
      Start my Koach journey
    </button>
  </div>
)}
          </div>
        </section>
      )}

      {onboardingComplete && (
        <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          koach<span>.</span>
        </div>

        <p className="sidebar-label">YOUR SPACE</p>

        <nav className="navigation">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="nav-icon">
                {["⌂", "◎", "◷", "◇"][index]}
              </span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">K</div>
          <div>
            <strong>Your profile</strong>
            <span>Personal journey</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            koach<span>.</span>
          </div>

          <span className="system-status">
            <span className="status-dot" />
            PERSONAL HEALTH INTELLIGENCE
          </span>

          <div className="date-label">YOUR DAILY OVERVIEW</div>
        </header>

         {activeTab === "Home" && (
          <>
            <section className="welcome-section">
              <p className="eyebrow">YOUR HEALTH, UNDERSTOOD.</p>

              <h1>
  {new Date().getHours() < 12
    ? "Good morning."
    : new Date().getHours() < 17
    ? "Good afternoon."
    : "Good evening."}
  <br />
  <span>Let's make today count.</span>
</h1>

              <p className="welcome-description">
                Your health journey isn't about being perfect. It's about
                finding what works for you, consistently.
              </p>
                       </section>

<section className="coach-chat-card">
  <div className="card-heading">
    <span>YOUR PERSONAL KOACH</span>
    <span className="metric-note">PERSONALISED GUIDANCE</span>
  </div>

  <h2>Let's get to know you better.</h2>

  <p className="coach-chat-description">
    Tell me about your sleep, activity, routines or what makes
    healthy habits difficult. I'll use what you share to understand
    your needs better.
  </p>

  <div className="coach-message-list" aria-live="polite">
    {coachMessages.length === 0 && (
      <div className="coach-message coach-message-assistant">
        <strong>Koach</strong>
        <p>
          I'm here to help you build healthier routines that fit
          your life. What would you like me to understand about you?
        </p>
      </div>
    )}

    {coachMessages.map((message) => (
      <div
        key={message.id}
        className={`coach-message ${
          message.role === "user"
            ? "coach-message-user"
            : "coach-message-assistant"
        }`}
      >
        <strong>
          {message.role === "user" ? "You" : "Koach"}
        </strong>
        <p>{message.text}</p>
      </div>
    ))}

    {coachLoading && (
      <div className="coach-message coach-message-assistant">
        <strong>Koach</strong>
        <p>Thinking about what you've shared...</p>
      </div>
    )}
  </div>

  <form
    className="coach-input-area"
    onSubmit={(event) => {
      event.preventDefault();
      void sendCoachMessage();
    }}
  >
    <input
      type="text"
      value={coachInput}
      onChange={(event) => setCoachInput(event.target.value)}
      placeholder="Tell me about your daily routine..."
      aria-label="Message Koach"
      disabled={coachLoading}
    />

    <button
      type="submit"
      className="primary-button"
      disabled={!coachInput.trim() || coachLoading}
    >
      Send
    </button>
  </form>

  {coachError && (
    <p className="coach-error">{coachError}</p>
  )}

  <p className="profile-completion-note">
    Your messages are stored locally in this prototype.
    You remain in control of the information you share.
  </p>
</section>

<section className="profile-completion-card">
  <div className="card-heading">
    <span>DATA MODE</span>
    <span className="metric-note">
      {observationMode === "demo" ? "SIMULATED DATA" : "LIVE DATA"}
    </span>
  </div>

  <h2>Choose your data experience</h2>

  <p>
    Demo Mode uses simulated observations. Live Mode will use
    genuine data sources when connected and authorised.
  </p>

  <div className="recommendation-actions">
    <button
      className={
        observationMode === "demo"
          ? "primary-button"
          : "secondary-button"
      }
      onClick={() => setObservationMode("demo")}
      aria-pressed={observationMode === "demo"}
    >
      Demo Mode
    </button>

    <button
      className={
        observationMode === "live"
          ? "primary-button"
          : "secondary-button"
      }
      onClick={() => setObservationMode("live")}
      aria-pressed={observationMode === "live"}
    >
      Live Mode
    </button>
  </div>

  <p className="profile-completion-note">
    {observationMode === "demo"
      ? "You are viewing clearly labelled simulated observations."
      : "No live data sources are connected yet. Historical findings will remain empty."}
  </p>
</section>

{!personalisationStarted && (
  <section className="profile-completion-card">
    <div className="card-heading">
      <span>YOUR PERSONAL PROFILE</span>
      <span className="metric-note">IN PROGRESS</span>
    </div>

    <h2>Your profile is taking shape.</h2>

    <p>
      Help Koach understand your routines, preferences and
      everyday challenges so it can make more relevant
      recommendations.
    </p>

    <div className="profile-completion-progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: "25%" }} />
      </div>
      <span>Getting started</span>
    </div>

    <button
      className="primary-button"
      onClick={() => setPersonalisationStarted(true)}
    >
      Continue personalising
    </button>

    <p className="profile-completion-note">
      You can complete this at your own pace.
    </p>
  </section>
)}
           
{personalisationStarted && personalisationStep === 1 && (
  <section className="profile-completion-card">
    <div className="card-heading">
      <span>PERSONALISING KOACH</span>
      <span className="metric-note">STEP 1 OF 3</span>
    </div>

    <h2>Let's understand your activity.</h2>

    <p>
      Tell us a little about your current movement habits.
      There are no right or wrong answers.
    </p>

    <div className="profile-edit-form">
      <label htmlFor="activity-level">
        How active are you on a typical day?
      </label>

      <select
        id="activity-level"
        value={currentActivityLevel}
        onChange={(event) => setCurrentActivityLevel(event.target.value)}
      >
        <option value="">Select an answer</option>
        <option value="Mostly sitting">Mostly sitting</option>
        <option value="Lightly active">Lightly active</option>
        <option value="Moderately active">Moderately active</option>
        <option value="Very active">Very active</option>
      </select>

      <label htmlFor="exercise-days">
        How many days do you usually exercise each week?
      </label>

      <select
        id="exercise-days"
        value={weeklyExerciseDays}
        onChange={(event) => setWeeklyExerciseDays(event.target.value)}
      >
        <option value="">Select an answer</option>
        <option value="0">0 days</option>
        <option value="1-2">1–2 days</option>
        <option value="3-4">3–4 days</option>
        <option value="5-7">5–7 days</option>
      </select>
    </div>

    <button
      className="primary-button"
      onClick={savePersonalisationStep1}
    >
      Continue
    </button>

    <button
      className="secondary-button"
      onClick={() => setPersonalisationStarted(false)}
    >
      Do this later
    </button>
  </section>
)}

{personalisationStarted && personalisationStep === 2 && (
  <section className="profile-completion-card">
    <div className="card-heading">
      <span>PERSONALISING KOACH</span>
      <span className="metric-note">STEP 2 OF 3</span>
    </div>

    <h2>Let's understand your sleep routine.</h2>

    <p>
      Knowing your usual sleep schedule helps Koach
      suggest routines that fit your day.
    </p>

    <div className="profile-edit-form">
      <label htmlFor="usual-bedtime">What time do you usually go to bed?</label>
      <input
        id="usual-bedtime"
        type="time"
        value={usualBedtime}
        onChange={(event) => setUsualBedtime(event.target.value)}
      />

      <label htmlFor="usual-wake-time">What time do you usually wake up?</label>
      <input
        id="usual-wake-time"
        type="time"
        value={usualWakeTime}
        onChange={(event) => setUsualWakeTime(event.target.value)}
      />
    </div>

    <button
      className="primary-button"
      onClick={savePersonalisationStep2}
    >
      Continue
    </button>

    <button
      className="secondary-button"
      onClick={() => setPersonalisationStarted(false)}
    >
      Do this later
    </button>
  </section>
)}

{personalisationStarted && personalisationStep === 3 && (
  <section className="profile-completion-card">
    <div className="card-heading">
      <span>PERSONALISING KOACH</span>
      <span className="metric-note">STEP 3 OF 3</span>
    </div>

    <h2>What makes staying active difficult?</h2>

    <p>
      Understanding your challenges helps Koach suggest
      realistic changes rather than generic routines.
    </p>

    <div className="profile-edit-form">
      <label htmlFor="main-barrier">
        What is your biggest challenge?
      </label>

      <select
        id="main-barrier"
        value={mainBarrier}
        onChange={(event) => setMainBarrier(event.target.value)}
      >
        <option value="">Select an answer</option>
        <option value="Lack of time">Lack of time</option>
        <option value="Low motivation">Low motivation</option>
        <option value="Tiredness or low energy">Tiredness or low energy</option>
        <option value="Inconsistent schedule">Inconsistent schedule</option>
        <option value="Limited access to facilities">Limited access to facilities</option>
        <option value="Other or unsure">Other or unsure</option>
      </select>

      <label htmlFor="exercise-environment">
        Where do you prefer to be active?
      </label>

      <select
        id="exercise-environment"
        value={exerciseEnvironment}
        onChange={(event) => setExerciseEnvironment(event.target.value)}
      >
        <option value="">Select an answer</option>
        <option value="At home">At home</option>
        <option value="Outdoors">Outdoors</option>
        <option value="At a gym">At a gym</option>
        <option value="Anywhere convenient">Anywhere convenient</option>
        <option value="No preference">No preference</option>
      </select>
    </div>

    <button
      className="primary-button"
      onClick={savePersonalisationStep3}
    >
      Complete my profile
    </button>

    <button
      className="secondary-button"
      onClick={() => setPersonalisationStarted(false)}
    >
      Do this later
    </button>
  </section>
)}




            <section className="overview-grid">
              <article className="overview-card goal-card">
                <div className="card-heading">
                  <span>YOUR MAIN GOAL</span>
                  <span className="card-symbol">↗</span>
                </div>

                <h2>{primaryGoal}</h2>

                <p>
  Small, sustainable actions that fit into your everyday life.
</p>

                <div className="goal-progress">
                  <div className="progress-track">
                    <div className="progress-fill" />
                  </div>
                  <span>Getting started</span>
                </div>
              </article>

              <article className="overview-card">
                <div className="card-heading">
                  <span>ACTIVITY</span>
                  <span className="metric-icon">↗</span>
                </div>

                <h2>
                  {activityMinutes} <small>min</small>
                </h2>

                <p>Movement today</p>
                <span className="metric-note">
  {observationMode === "demo" ? "SIMULATED DATA" : "USER PROFILE DATA"}
</span>
              </article>

              <article className="overview-card">
                <div className="card-heading">
                  <span>SLEEP</span>
                  <span className="metric-icon">☾</span>
                </div>

                <h2>
                  {sleepHours} <small>hrs</small>
                </h2>

                <p>Last night's sleep</p>
                <span className="metric-note">DEMO DATA</span>
              </article>
            </section>

            <section className="coaching-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A NOTE FROM KOACH</p>
                  <h2>Your next best step</h2>
                </div>

                <span className="insight-tag">PERSONALISED INSIGHT</span>
              </div>

              <article className="recommendation-card">
                <div className="recommendation-marker">K</div>

                <div className="recommendation-content">
                  <h3>
  {currentRecommendation?.title ??
    "Let's learn a little more about your routine."}
</h3>

                 <p>
  {currentRecommendation?.action ??
    recommendationResult.reasons[0]}
</p>

<button
  className="text-button"
  onClick={() =>
    setShowRecommendationReason((previous) => !previous)
  }
  aria-expanded={showRecommendationReason}
>
  {showRecommendationReason ? "See less" : "See more"}
</button>

{showRecommendationReason && (
  <div className="reason-box">
  <strong>Why this suggestion?</strong>
  <span>
    {currentRecommendation?.explanation ??
      "Koach needs more personal information before making a recommendation."}
  </span>
</div>
)}

                  {recommendationStatus === "pending" ? (
                    <div className="recommendation-actions">
                      <button
                        className="primary-button"
                        onClick={() => {
  if (!currentRecommendation) return;

  const newActivity: ScheduledActivity = {
    id: currentRecommendation.id,
    title: currentRecommendation.title,
    durationMinutes:
      currentRecommendation.durationMinutes ?? 0,
    timing: currentRecommendation.timing,
    location: "Location to be confirmed",
    status: "scheduled",
  };

  setScheduledActivities((previous) => [
    ...previous.filter(
      (activity) => activity.id !== newActivity.id
    ),
    newActivity,
  ]);

  setRecommendationStatus("accepted");
}}
disabled={!currentRecommendation}
                      >
                        Accept suggestion
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => setRecommendationStatus("modified")}
                      >
                        Modify
                      </button>

                      <button
                        className="text-button"
                        onClick={() => setRecommendationStatus("declined")}
                      >
                        Keep my current plan
                      </button>
                    </div>
                  ) : (
                    <div className="decision-message">
                      <strong>
                        {recommendationStatus === "accepted" &&
                          "Suggestion accepted."}

                        {recommendationStatus === "modified" &&
                          "Let's find an alternative that works better."}

                        {recommendationStatus === "declined" &&
                          "Your current plan remains unchanged."}
                      </strong>

                      <button
                        className="text-button"
                        onClick={() => setRecommendationStatus("pending")}
                      >
                        Undo decision
                      </button>
                    </div>
                  )}
                </div>
              </article>
            </section>

            {scheduledActivities.length > 0 && (
  <section className="plan-section">
    <div className="section-heading">
      <div>
        <p className="eyebrow">YOUR SCHEDULE</p>
        <h2>Activities you've accepted</h2>
      </div>
    </div>

    <div className="routine-list">
      {scheduledActivities.map((activity) => (
        <div className="routine-item" key={activity.id}>
          <span className="routine-time">
            {activity.timing.toUpperCase()}
          </span>

          <div className="routine-indicator green" />

          <div className="routine-description">
            <strong>{activity.title}</strong>
            <p>
              {activity.durationMinutes} minutes · {activity.location}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
)}

            <section className="plan-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR ROUTINE</p>
                  <h2>A little structure for today</h2>
                </div>

                <span className="plan-date">TODAY · DEMO PLAN</span>
              </div>

              <div className="routine-list">
                <div className="routine-item">
                  <span className="routine-time">MORNING</span>
                  <div className="routine-indicator green" />

                  <div className="routine-description">
                    <strong>Start gently</strong>
                    <span>Take a few minutes to stretch and prepare.</span>
                  </div>

                  <span className="routine-duration">5–10 min</span>
                </div>

                <div className="routine-item">
                  <span className="routine-time">AFTERNOON</span>
                  <div className="routine-indicator yellow" />

                  <div className="routine-description">
                    <strong>Move naturally</strong>
                    <span>Take a short movement break when convenient.</span>
                  </div>

                  <span className="routine-duration">10 min</span>
                </div>

                <div className="routine-item">
                  <span className="routine-time">EVENING</span>
                  <div className="routine-indicator green" />

                  <div className="routine-description">
                    <strong>Take a relaxed {preferredActivity.toLowerCase()}</strong>
                    <span>Choose a comfortable pace and enjoy the movement.</span>
                  </div>

                  <span className="routine-duration">20 min</span>
                </div>
              </div>
            </section>

            <footer className="dashboard-footer">
              Koach helps you build healthier routines around real life.
              <span>DEMONSTRATION PROTOTYPE · SAMPLE DATA</span>
            </footer>
          </>
        )}

        {activeTab === "My Goals" && (
  <section className="placeholder-section">
    <p className="eyebrow">YOUR PERSONAL CONTEXT</p>
    <h1>My Goals</h1>

    <p>Update your personal goal and preferred activity.</p>

    <div className="profile-edit-form">
      <label htmlFor="goal-input">Primary goal</label>
      <input
        id="goal-input"
        type="text"
        value={goalDraft}
        onChange={(event) => setGoalDraft(event.target.value)}
        placeholder="What is your health goal?"
      />

      <label htmlFor="activity-input">Preferred activity</label>
      <input
        id="activity-input"
        type="text"
        value={activityDraft}
        onChange={(event) => setActivityDraft(event.target.value)}
        placeholder="e.g. Walking, cycling, swimming"
      />

      <button
        className="primary-button"
        onClick={saveProfileChanges}
      >
        Save Changes
      </button>

      {profileSaveMessage && (
        <p role="status">{profileSaveMessage}</p>
      )}
    </div>

    <button
      className="primary-button"
      onClick={() => setActiveTab("Home")}
    >
      Return to Home
    </button>
  </section>
)}

        {activeTab === "Insights" && (
  <section className="insights-page">
    <p className="eyebrow">YOUR PROGRESS AND PATTERNS</p>
    <h1>Insights</h1>

    <p className="insights-intro">
      A clearer picture of your activity, sleep and emerging routines.
    </p>

    <div className="insights-mode-label">
      {observationMode === "demo"
        ? "Demo Mode · Simulated observations"
        : "Live Mode · Connected observations only"}
    </div>

    {observationMode === "live" ? (
      <article className="insight-empty-state">
        <h2>Your insights will appear here</h2>
        <p>
          Koach needs permission-approved activity and sleep observations
          before it can display your personal trends. Demo observations
          are not used in Live Mode.
        </p>
      </article>
    ) : (
      <>
        <section className="insight-panel">
          <div className="insight-panel-header">
            <div>
              <p className="eyebrow">MOVEMENT</p>
              <h2>Daily activity</h2>
            </div>

            <div className="insight-period-control">
              <button
                className={insightPeriod === "7" ? "selected" : ""}
                onClick={() => setInsightPeriod("7")}
              >
                7 days
              </button>

              <button
                className={insightPeriod === "3" ? "selected" : ""}
                onClick={() => setInsightPeriod("3")}
              >
                3 days
              </button>
            </div>
          </div>

          <div className="insight-chart">
            {visibleInsightDays.map((day) => (
              <div className="insight-chart-column" key={day.date}>
                <strong>
                  {day.steps.toLocaleString()}
                </strong>

                <div className="insight-bar-track">
                  <div
                    className="insight-bar activity-bar"
                    style={{
                      height: `${(day.steps / maxSteps) * 100}%`,
                    }}
                  />
                </div>

                <span>{day.label}</span>
              </div>
            ))}
          </div>

          <p className="insight-footnote">
            Daily step counts · Simulated demonstration data
          </p>
        </section>

        <section className="insight-panel">
          <div>
            <p className="eyebrow">REST AND RECOVERY</p>
            <h2>Sleep duration</h2>
          </div>

          <div className="insight-sleep-list">
            {visibleInsightDays.map((day) => (
              <div className="insight-sleep-row" key={day.date}>
                <span>{day.label}</span>

                <div className="insight-sleep-track">
                  <div
                    className="insight-sleep-fill"
                    style={{
                      width: `${
                        Math.min((day.sleepHours ?? 0) / 10, 1) * 100
                      }%`,
                    }}
                  />
                </div>

                <strong>
                  {day.sleepHours === null
                    ? "—"
                    : `${day.sleepHours} hrs`}
                </strong>
              </div>
            ))}
          </div>

          <p className="insight-footnote">
            Estimated time between recorded bedtime and wake time.
            Simulated demonstration data.
          </p>
        </section>
      </>
    )}

    <section className="insight-panel">
      <p className="eyebrow">BEHAVIOUR INTELLIGENCE</p>
      <h2>Detected patterns</h2>

      <p className="insights-intro">
        These are potential patterns identified by Koach. They are
        not automatically treated as confirmed explanations.
      </p>

      {allPatterns.length > 0 ? (
        <div className="insight-pattern-list">
          {allPatterns.map((pattern) => (
            <details className="insight-pattern-card" key={pattern.id}>
              <summary>
                <span>
                  <strong>{pattern.title}</strong>
                  <small>
                    {pattern.status}
                    {" · "}
                    Confidence: {pattern.confidence}
                  </small>
                </span>

                <span className="insight-expand-icon">+</span>
              </summary>

              <div className="insight-pattern-details">
                <p>{pattern.description}</p>
                <p>{pattern.explanation}</p>

                <small>
                  Supporting observations:{" "}
                  {pattern.evidenceObservationIds?.length ?? 0}
                </small>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p>
          No patterns have been identified in this data mode yet.
        </p>
      )}
    </section>

    <p className="insight-disclaimer">
      Demo Mode uses simulated data to demonstrate Koach's intelligence
      features. These figures do not represent your actual behaviour.
    </p>

    <button
      className="primary-button"
      onClick={() => setActiveTab("Home")}
    >
      Return to Home
    </button>
  </section>
)}
           

        {activeTab === "Data & Privacy" && (
          <section className="placeholder-section">
            <p className="eyebrow">YOUR INFORMATION</p>
            <h1>Data & Privacy</h1>

            <p>
              Your demonstration Personal Context Model currently contains:
            </p>

            <h2>{personalContext.facts.length} profile facts</h2>

            <p>
              Confirmed:{" "}
              {personalContext.facts.filter(
                (fact) => fact.status === "confirmed"
              ).length}
            </p>

            <p>
              Observed:{" "}
              {personalContext.facts.filter(
                (fact) => fact.status === "observed"
              ).length}
            </p>

            <p>
              These are local demonstration records. No live wearable,
              calendar or location integration is connected.
            </p>

            <button
              className="primary-button"
              onClick={() => setActiveTab("Home")}
            >
              Return to Home
            </button>
          </section>
        )}
           </section>
        </main>
      )}
    </>
  );
}

export default App;
