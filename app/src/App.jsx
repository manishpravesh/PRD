import { useEffect, useMemo, useState } from "react";
import { apiRequest, money } from "./lib/api";
import "./App.css";

const VIEWS = {
  public: "Public",
  subscriber: "Subscriber",
  admin: "Admin",
};

function App() {
  const [view, setView] = useState("public");
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [winners, setWinners] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [adminWinners, setAdminWinners] = useState([]);

  const [newScore, setNewScore] = useState({ score: "", scoreDate: "" });

  useEffect(() => {
    localStorage.setItem("auth_token", token);
  }, [token]);

  const identityHint = useMemo(() => {
    if (!token) return "No bearer token configured";
    return `Token loaded for ${VIEWS[view]} mode`;
  }, [token, view]);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadPublic() {
    const [charityRes, drawRes] = await Promise.all([
      apiRequest("/api/v1/charities"),
      apiRequest("/api/v1/draws"),
    ]);
    setCharities(charityRes.data || []);
    setDraws(drawRes.data || []);
  }

  async function loadSubscriber() {
    const [subRes, scoreRes, winnerRes] = await Promise.all([
      apiRequest("/api/v1/subscriptions/status", { token }),
      apiRequest("/api/v1/scores/latest", { token }),
      apiRequest("/api/v1/winners/me", { token }),
    ]);

    setSubscription(subRes.data?.subscription || null);
    setScores(scoreRes.data?.scores || []);
    setWinners(winnerRes.data || []);
  }

  async function loadAdmin() {
    const [analyticsRes, winnersRes, drawsRes] = await Promise.all([
      apiRequest("/api/v1/admin/analytics", { token }),
      apiRequest("/api/v1/winners/admin/all", { token }),
      apiRequest("/api/v1/draws/admin/all", { token }),
    ]);

    setAdminAnalytics(analyticsRes.data || null);
    setAdminWinners(winnersRes.data || []);
    setDraws(drawsRes.data || []);
  }

  useEffect(() => {
    run(async () => {
      if (view === "public") return loadPublic();
      if (view === "subscriber") return loadSubscriber();
      return loadAdmin();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function submitScore(event) {
    event.preventDefault();
    await run(async () => {
      await apiRequest("/api/v1/scores", {
        method: "POST",
        token,
        body: {
          score: Number(newScore.score),
          scoreDate: newScore.scoreDate,
        },
      });
      setNewScore({ score: "", scoreDate: "" });
      await loadSubscriber();
    });
  }

  async function startCheckout(plan) {
    await run(async () => {
      const response = await apiRequest("/api/v1/subscriptions/checkout", {
        method: "POST",
        token,
        body: { plan },
      });
      const checkoutUrl = response.data?.checkoutUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  async function reviewWinner(winnerId, action) {
    await run(async () => {
      await apiRequest(`/api/v1/winners/admin/${winnerId}/review`, {
        method: "PUT",
        token,
        body: {
          action,
          rejectionReason:
            action === "reject" ? "Proof did not meet criteria" : undefined,
        },
      });
      await loadAdmin();
    });
  }

  return (
    <div className="shell">
      <header className="hero-panel">
        <div className="brand-kicker">Digital Heroes Challenge Build</div>
        <h1>Play For Better</h1>
        <p>
          A subscription-driven golf rewards engine where performance fuels
          prize pools and charitable impact.
        </p>
        <div className="mode-switch">
          {Object.entries(VIEWS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={view === key ? "chip chip-active" : "chip"}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="auth-bar">
        <label htmlFor="token">Bearer token</label>
        <input
          id="token"
          value={token}
          onChange={(event) => setToken(event.target.value.trim())}
          placeholder="Paste Supabase JWT for subscriber/admin routes"
        />
        <span>{identityHint}</span>
      </section>

      {error ? <div className="flash flash-error">{error}</div> : null}
      {busy ? <div className="flash">Loading data...</div> : null}

      {view === "public" ? (
        <main className="grid">
          <section className="card">
            <h2>Featured Charities</h2>
            <ul className="list">
              {charities.map((charity) => (
                <li key={charity.id}>
                  <div>
                    <strong>{charity.name}</strong>
                    <p>{charity.description || "No description yet."}</p>
                  </div>
                  <span
                    className={charity.is_featured ? "tag tag-featured" : "tag"}
                  >
                    {charity.is_featured ? "Featured" : charity.country_code}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Published Draws</h2>
            <ul className="list">
              {draws.map((draw) => (
                <li key={draw.id}>
                  <div>
                    <strong>{draw.draw_month}</strong>
                    <p>
                      Winning numbers:{" "}
                      {(draw.winning_numbers || []).join(" - ")}
                    </p>
                  </div>
                  <span className="tag">{draw.mode}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      ) : null}

      {view === "subscriber" ? (
        <main className="grid">
          <section className="card">
            <h2>Subscription</h2>
            <p>
              Status: <strong>{subscription?.status || "inactive"}</strong>
            </p>
            <p>
              Plan: <strong>{subscription?.plan || "none"}</strong>
            </p>
            <p>
              Renewal:{" "}
              <strong>{subscription?.current_period_end || "-"}</strong>
            </p>
            <div className="actions">
              <button type="button" onClick={() => startCheckout("monthly")}>
                Start Monthly
              </button>
              <button type="button" onClick={() => startCheckout("yearly")}>
                Start Yearly
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  run(() =>
                    apiRequest("/api/v1/subscriptions/cancel", {
                      method: "POST",
                      token,
                    }).then(loadSubscriber),
                  )
                }
              >
                Cancel At Period End
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Score Entry</h2>
            <form className="score-form" onSubmit={submitScore}>
              <input
                type="number"
                min="1"
                max="45"
                placeholder="Stableford score"
                value={newScore.score}
                onChange={(event) =>
                  setNewScore((prev) => ({
                    ...prev,
                    score: event.target.value,
                  }))
                }
                required
              />
              <input
                type="date"
                value={newScore.scoreDate}
                onChange={(event) =>
                  setNewScore((prev) => ({
                    ...prev,
                    scoreDate: event.target.value,
                  }))
                }
                required
              />
              <button type="submit">Save Score</button>
            </form>
            <ul className="list compact">
              {scores.map((score) => (
                <li key={score.id}>
                  <strong>{score.score}</strong>
                  <span>{score.score_date}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card wide">
            <h2>Winnings & Verification</h2>
            <ul className="list">
              {winners.map((winner) => (
                <li key={winner.id}>
                  <div>
                    <strong>{winner.match_count}-Match Winner</strong>
                    <p>
                      Prize: {money(winner.prize_inr)} | Verify:{" "}
                      {winner.verification_status}
                    </p>
                  </div>
                  <span className="tag">{winner.payment_status}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      ) : null}

      {view === "admin" ? (
        <main className="grid">
          <section className="card">
            <h2>Analytics</h2>
            <p>
              Total users: <strong>{adminAnalytics?.totalUsers ?? 0}</strong>
            </p>
            <p>
              Total prize pool:{" "}
              <strong>{money(adminAnalytics?.totalPrizePool || 0)}</strong>
            </p>
            <p>
              Total charity contribution:{" "}
              <strong>
                {money(adminAnalytics?.totalCharityContribution || 0)}
              </strong>
            </p>
          </section>

          <section className="card">
            <h2>Draw Operations</h2>
            <div className="actions wrap">
              {draws.map((draw) => (
                <div key={draw.id} className="action-row">
                  <span>
                    {draw.draw_month} ({draw.status})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      run(() =>
                        apiRequest(`/api/v1/draws/${draw.id}/simulate`, {
                          method: "POST",
                          token,
                        }).then(loadAdmin),
                      )
                    }
                  >
                    Simulate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      run(() =>
                        apiRequest(`/api/v1/draws/${draw.id}/publish`, {
                          method: "POST",
                          token,
                        }).then(loadAdmin),
                      )
                    }
                  >
                    Publish
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card wide">
            <h2>Winner Review Queue</h2>
            <ul className="list">
              {adminWinners.map((winner) => (
                <li key={winner.id}>
                  <div>
                    <strong>
                      User {winner.user_id.slice(0, 8)} | {winner.match_count}
                      -Match
                    </strong>
                    <p>
                      {money(winner.prize_inr)} | {winner.verification_status} |{" "}
                      {winner.payment_status}
                    </p>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() => reviewWinner(winner.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => reviewWinner(winner.id, "reject")}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewWinner(winner.id, "mark-paid")}
                    >
                      Mark Paid
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>
      ) : null}
    </div>
  );
}

export default App;
