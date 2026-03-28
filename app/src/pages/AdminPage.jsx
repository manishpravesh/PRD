import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest, money } from "../lib/api";

export default function AdminPage() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);

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
    const [analyticsRes, drawsRes, winnersRes] = await Promise.all([
      apiRequest("/api/v1/admin/analytics", { token }),
      apiRequest("/api/v1/draws/admin/all", { token }),
      apiRequest("/api/v1/winners/admin/all", { token }),
    ]);

    setAnalytics(analyticsRes.data || null);
    setDraws(drawsRes.data || []);
    setWinners(winnersRes.data || []);
  }

  useEffect(() => {
    run(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function runDrawAction(drawId, action) {
    const path = action === "simulate" ? `/api/v1/draws/${drawId}/simulate` : `/api/v1/draws/${drawId}/publish`;

    await run(async () => {
      await apiRequest(path, { method: "POST", token });
      await load();
    });
  }

  async function reviewWinner(winnerId, action) {
    await run(async () => {
      await apiRequest(`/api/v1/winners/admin/${winnerId}/review`, {
        method: "PUT",
        token,
        body: {
          action,
          rejectionReason: action === "reject" ? "Proof did not meet criteria" : undefined,
        },
      });
      await load();
    });
  }

  return (
    <main className="grid">
      {error ? <div className="flash flash-error wide">{error}</div> : null}
      {busy ? <div className="flash wide">Syncing admin data...</div> : null}

      <section className="card">
        <h2>Analytics</h2>
        <p>Total users: <strong>{analytics?.totalUsers ?? 0}</strong></p>
        <p>Total prize pool: <strong>{money(analytics?.totalPrizePool || 0)}</strong></p>
        <p>Total charity contribution: <strong>{money(analytics?.totalCharityContribution || 0)}</strong></p>
      </section>

      <section className="card">
        <h2>Draw Operations</h2>
        <div className="actions wrap">
          {draws.map((draw) => (
            <div key={draw.id} className="action-row">
              <span>{draw.draw_month} ({draw.status})</span>
              <button type="button" onClick={() => runDrawAction(draw.id, "simulate")}>Simulate</button>
              <button type="button" onClick={() => runDrawAction(draw.id, "publish")}>Publish</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card wide">
        <h2>Winner Review Queue</h2>
        <ul className="list">
          {winners.map((winner) => (
            <li key={winner.id}>
              <div>
                <strong>User {winner.user_id.slice(0, 8)} | {winner.match_count}-Match</strong>
                <p>{money(winner.prize_inr)} | {winner.verification_status} | {winner.payment_status}</p>
              </div>
              <div className="actions">
                <button type="button" onClick={() => reviewWinner(winner.id, "approve")}>Approve</button>
                <button type="button" className="ghost" onClick={() => reviewWinner(winner.id, "reject")}>Reject</button>
                <button type="button" onClick={() => reviewWinner(winner.id, "mark-paid")}>Mark Paid</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
