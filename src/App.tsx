
import { useEffect, useState } from "react";
import "./App.css";

import {
  createPersonalContext,
  addFact,
  confirmFact,
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
    source: "user_input",
    permissionRequired: false,
  });

  context = addFact(context, {
    category: "preferences",
    key: "preferred_activity",
    value: "Walking",
    status: "confirmed",
    source: "user_input",
    permissionRequired: false,
  });

  context = addFact(context, {
    category: "health",
    key: "activity_minutes",
    value: 32,
    status: "observed",
    source: "permitted_sensor",
    permissionRequired: true,
  });

  context = addFact(context, {
    category: "health",
    key: "sleep_hours",
    value: 7.2,
    status: "observed",
    source: "permitted_sensor",
    permissionRequired: true,
  });

  context = addFact(context, {
    category: "routines",
    key: "morning_activity_pattern",
    value: "Morning exercise may be difficult to accommodate",
    status: "observed",
    source: "system_observation",
    confidence: 0.65,
    permissionRequired: false,
  });

  return context;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");

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

  return (
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

            <p>
              Your current primary goal is:
            </p>

            <h2>{primaryGoal}</h2>

            <p>
              Preferred activity: {preferredActivity}
            </p>

            <p>
              These values are being read from your Personal Context Model.
            </p>

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

            <p>
              This is sample information, not a finding from live monitoring.
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
  );
}

export default App;
