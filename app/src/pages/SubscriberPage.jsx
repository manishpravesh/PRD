import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest, money } from "../lib/api";

export default function SubscriberPage() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [winners, setWinners] = useState([]);
  const [newScore, setNewScore] = useState({ score: "", scoreDate: "" });

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

  async function load() {
    const [subRes, scoreRes, winnerRes] = await Promise.all([
      apiRequest("/api/v1/subscriptions/status", { token }),
      apiRequest("/api/v1/scores/latest", { token }),
      apiRequest("/api/v1/winners/me", { token }),
    ]);

    setSubscription(subRes.data?.subscription || null);
    setScores(scoreRes.data?.scores || []);
    setWinners(winnerRes.data || []);
  }

  useEffect(() => {
    run(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      await load();
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

  return (
    <main className="grid">
      {error ? <div className="flash flash-error wide">{error}</div> : null}
      {busy ? <div className="flash wide">Syncing dashboard...</div> : null}

      <section className="card">
        <h2>Subscription</h2>
        <p>Status: <strong>{subscription?.status || "inactive"}</strong></p>
        <p>Plan: <strong>{subscription?.plan || "none"}</strong></p>
        <p>Renewal: <strong>{subscription?.current_period_end || "-"}</strong></p>
        <div className="actions">
          <button type="button" onClick={() => startCheckout("monthly")}>Start Monthly</button>
          <button type="button" onClick={() => startCheckout("yearly")}>Start Yearly</button>
          <button
            type="button"
            className="ghost"
            onClick={() => run(() => apiRequest("/api/v1/subscriptions/cancel", { method: "POST", token }).then(load))}
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
            onChange={(event) => setNewScore((prev) => ({ ...prev, score: event.target.value }))}
            required
          />
          <input
            type="date"
            value={newScore.scoreDate}
            onChange={(event) => setNewScore((prev) => ({ ...prev, scoreDate: event.target.value }))}
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
                <p>Prize: {money(winner.prize_inr)} | Verify: {winner.verification_status}</p>
              </div>
              <span className="tag">{winner.payment_status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
