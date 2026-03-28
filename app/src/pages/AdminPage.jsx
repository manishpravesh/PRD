import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { apiRequest, money } from "../lib/api";

export default function AdminPage() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [drawForm, setDrawForm] = useState({ drawMonth: "", mode: "random" });
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    countryCode: "IN",
    isFeatured: false,
  });

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
    const [analyticsRes, drawsRes, winnersRes, charitiesRes] =
      await Promise.all([
        apiRequest("/api/v1/admin/analytics", { token }),
        apiRequest("/api/v1/draws/admin/all", { token }),
        apiRequest("/api/v1/winners/admin/all", { token }),
        apiRequest("/api/v1/charities"),
      ]);

    setAnalytics(analyticsRes.data || null);
    setDraws(drawsRes.data || []);
    setWinners(winnersRes.data || []);
    setCharities(charitiesRes.data || []);
  }

  useEffect(() => {
    run(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function runDrawAction(drawId, action) {
    const path =
      action === "simulate"
        ? `/api/v1/draws/${drawId}/simulate`
        : `/api/v1/draws/${drawId}/publish`;

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
          rejectionReason:
            action === "reject" ? "Proof did not meet criteria" : undefined,
        },
      });
      await load();
    });
  }

  async function createDraw(event) {
    event.preventDefault();
    await run(async () => {
      await apiRequest("/api/v1/draws", {
        method: "POST",
        token,
        body: drawForm,
      });
      setDrawForm((prev) => ({ ...prev, drawMonth: "" }));
      await load();
    });
  }

  async function createCharity(event) {
    event.preventDefault();
    await run(async () => {
      await apiRequest("/api/v1/charities", {
        method: "POST",
        token,
        body: charityForm,
      });
      setCharityForm({
        name: "",
        description: "",
        countryCode: "IN",
        isFeatured: false,
      });
      await load();
    });
  }

  async function deleteCharity(charityId) {
    await run(async () => {
      await apiRequest(`/api/v1/charities/${charityId}`, {
        method: "DELETE",
        token,
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
        <p>
          Total users: <strong>{analytics?.totalUsers ?? 0}</strong>
        </p>
        <p>
          Total prize pool:{" "}
          <strong>{money(analytics?.totalPrizePool || 0)}</strong>
        </p>
        <p>
          Total charity contribution:{" "}
          <strong>{money(analytics?.totalCharityContribution || 0)}</strong>
        </p>
      </section>

      <section className="card">
        <h2>Draw Operations</h2>
        <form className="score-form" onSubmit={createDraw}>
          <input
            type="date"
            value={drawForm.drawMonth}
            onChange={(event) =>
              setDrawForm((prev) => ({
                ...prev,
                drawMonth: event.target.value,
              }))
            }
            required
          />
          <select
            value={drawForm.mode}
            onChange={(event) =>
              setDrawForm((prev) => ({ ...prev, mode: event.target.value }))
            }
          >
            <option value="random">random</option>
            <option value="algorithmic">algorithmic</option>
          </select>
          <button type="submit">Create Draw</button>
        </form>
        <div className="actions wrap">
          {draws.map((draw) => (
            <div key={draw.id} className="action-row">
              <span>
                {draw.draw_month} ({draw.status})
              </span>
              <button
                type="button"
                onClick={() => runDrawAction(draw.id, "simulate")}
              >
                Simulate
              </button>
              <button
                type="button"
                onClick={() => runDrawAction(draw.id, "publish")}
              >
                Publish
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card wide">
        <h2>Charity Management</h2>
        <form className="score-form" onSubmit={createCharity}>
          <input
            type="text"
            placeholder="Charity name"
            value={charityForm.name}
            onChange={(event) =>
              setCharityForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={charityForm.description}
            onChange={(event) =>
              setCharityForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
          <input
            type="text"
            maxLength="2"
            placeholder="Country"
            value={charityForm.countryCode}
            onChange={(event) =>
              setCharityForm((prev) => ({
                ...prev,
                countryCode: event.target.value.toUpperCase(),
              }))
            }
          />
          <button
            type="button"
            className={charityForm.isFeatured ? "" : "ghost"}
            onClick={() =>
              setCharityForm((prev) => ({
                ...prev,
                isFeatured: !prev.isFeatured,
              }))
            }
          >
            {charityForm.isFeatured ? "Featured" : "Standard"}
          </button>
          <button type="submit">Add Charity</button>
        </form>

        <ul className="list">
          {charities.map((charity) => (
            <li key={charity.id}>
              <div>
                <strong>{charity.name}</strong>
                <p>{charity.description || "No description"}</p>
              </div>
              <div className="actions">
                <span
                  className={charity.is_featured ? "tag tag-featured" : "tag"}
                >
                  {charity.is_featured ? "Featured" : charity.country_code}
                </span>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => deleteCharity(charity.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card wide">
        <h2>Winner Review Queue</h2>
        <ul className="list">
          {winners.map((winner) => (
            <li key={winner.id}>
              <div>
                <strong>
                  User {winner.user_id.slice(0, 8)} | {winner.match_count}-Match
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
  );
}
