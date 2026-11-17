
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
} from "./intelligence/pattern-detection/patternDetection";

import {
  createPersonalContext,
  addFact,
  confirmFact,
  updateFact,
} from "./intelligence/personal-profile/personalContext";

import type { PersonalContext } from "./intelligence/personal-profile/types";

type Tab = "Home" | "My Goals" | "Insights" | "Data & Privacy";

type RecommendationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "modified";

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
  useEffect(() => {
  localStorage.setItem(
    "koach-personal-context",
    JSON.stringify(personalContext)
  );
}, [personalContext]);

  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>("pending");

  const tabs: Tab[] = ["Home", "My Goals", "Insights", "Data & Privacy"];

  // Read values from the Personal Context Model.
  function getProfileValue(key: string, fallback: string): string {
    const fact = personalContext.facts.find((item) => item.key === key);

    return fact ? String(fact.value) : fallback;
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

  const activityMinutes = getProfileValue("activity_minutes", "—");

  const sleepHours = getProfileValue("sleep_hours", "—");

  const morningPattern = personalContext.facts.find(
    (fact) => fact.key === "morning_activity_pattern"
  );

  function confirmMorningPattern() {
    if (!morningPattern) return;

    setPersonalContext((current) =>
      confirmFact(current, morningPattern.id)
    );
  }
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
                Good morning.
                <br />
                <span>Let's make today count.</span>
              </h1>

              <p className="welcome-description">
                Your health journey isn't about being perfect. It's about
                finding what works for you, consistently.
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
                <span className="metric-note">DEMO DATA</span>
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
                  <h3>Consider moving your walk to the evening.</h3>

                  <p>
                    Your demonstration activity pattern suggests that
                    mornings may be harder to accommodate. An evening walk
                    could offer a more practical alternative.
                  </p>

                  <div className="reason-box">
                    <strong>Why this suggestion?</strong>
                    <span>
                      Koach has an observed morning routine pattern in the
                      demonstration profile. It is an observation, not a
                      confirmed fact about your routine.
                    </span>
                  </div>

                  {recommendationStatus === "pending" ? (
                    <div className="recommendation-actions">
                      <button
                        className="primary-button"
                        onClick={() => setRecommendationStatus("accepted")}
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
          <section className="placeholder-section">
            <p className="eyebrow">PATTERNS AND OBSERVATIONS</p>
            <h1>Insights</h1>

            <p>
              Koach has the following demonstration observation:
            </p>

            {morningPattern && (
              <article className="reason-box">
                <strong>{String(morningPattern.value)}</strong>

                <span>
                  Status: {morningPattern.status}
                  {" · "}
                  Confidence: {Math.round(
                    (morningPattern.confidence ?? 0) * 100
                  )}%
                </span>

                {morningPattern.status !== "confirmed" ? (
                  <button
                    className="primary-button"
                    onClick={confirmMorningPattern}
                  >
                    Confirm this observation
                  </button>
                ) : (
                  <strong>You've confirmed this observation.</strong>
                )}
              </article>
            )}

           
<section className="reason-box">
  <strong>Historical Pattern Findings</strong>

  <p>
    Data mode: {observationMode === "demo" ? "Demo Mode — simulated data" : "Live Mode"}
  </p>

  {historicalPatterns.length > 0 ? (
    historicalPatterns.map((pattern) => (
      <article key={pattern.id}>
        <h3>{pattern.title}</h3>

        <p>{pattern.description}</p>

        <p>
          Status: {pattern.status}
          {" · "}
          Confidence: {pattern.confidence}
        </p>

        <p>{pattern.explanation}</p>

        <p>
          Supporting observations: {pattern.evidenceObservationIds?.length ?? 0}
        </p>
      </article>
    ))
  ) : (
    <p>
      No historical patterns are available in this data mode yet.
    </p>
  )}
</section>

<p>
  Historical findings are candidates for investigation, not confirmed
  explanations of behaviour.
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
