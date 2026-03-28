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
  const [charities, setCharities] = useState([]);
  const [preference, setPreference] = useState(null);
  const [donations, setDonations] = useState([]);
  const [newScore, setNewScore] = useState({ score: "", scoreDate: "" });
  const [preferenceForm, setPreferenceForm] = useState({
    charityId: "",
    contributionPercent: "10",
  });
  const [donationForm, setDonationForm] = useState({
    charityId: "",
    amountInr: "",
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
    const [
      subRes,
      scoreRes,
      winnerRes,
      charitiesRes,
      preferenceRes,
      donationsRes,
    ] = await Promise.all([
      apiRequest("/api/v1/subscriptions/status", { token }),
      apiRequest("/api/v1/scores/latest", { token }),
      apiRequest("/api/v1/winners/me", { token }),
      apiRequest("/api/v1/charities"),
      apiRequest("/api/v1/charities/me/preference", { token }),
      apiRequest("/api/v1/charities/me/donations", { token }),
    ]);

    setSubscription(subRes.data?.subscription || null);
    setScores(scoreRes.data?.scores || []);
    setWinners(winnerRes.data || []);
    setCharities(charitiesRes.data || []);
    setPreference(preferenceRes.data || null);
    setDonations(donationsRes.data || []);

    if (preferenceRes.data) {
      setPreferenceForm({
        charityId: preferenceRes.data.charity_id,
        contributionPercent: String(preferenceRes.data.contribution_percent),
      });
    }

    if (!donationForm.charityId && (charitiesRes.data || []).length > 0) {
      setDonationForm((prev) => ({
        ...prev,
        charityId: charitiesRes.data[0].id,
      }));
    }
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

  async function savePreference(event) {
    event.preventDefault();
    await run(async () => {
      await apiRequest("/api/v1/charities/me/preference", {
        method: "PUT",
        token,
        body: {
          charityId: preferenceForm.charityId,
          contributionPercent: Number(preferenceForm.contributionPercent),
        },
      });
      await load();
    });
  }

  async function submitDonation(event) {
    event.preventDefault();
    await run(async () => {
      await apiRequest("/api/v1/charities/me/donations", {
        method: "POST",
        token,
        body: {
          charityId: donationForm.charityId,
          amountInr: Number(donationForm.amountInr),
        },
      });
      setDonationForm((prev) => ({ ...prev, amountInr: "" }));
      await load();
    });
  }

  return (
    <main className="grid">
      {error ? <div className="flash flash-error wide">{error}</div> : null}
      {busy ? <div className="flash wide">Syncing dashboard...</div> : null}

      <section className="card">
        <h2>Subscription</h2>
        <p>
          Status: <strong>{subscription?.status || "inactive"}</strong>
        </p>
        <p>
          Plan: <strong>{subscription?.plan || "none"}</strong>
        </p>
        <p>
          Renewal: <strong>{subscription?.current_period_end || "-"}</strong>
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
                }).then(load),
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
              setNewScore((prev) => ({ ...prev, score: event.target.value }))
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

      <section className="card">
        <h2>Charity Preference</h2>
        <p>
          Current:{" "}
          <strong>{preference?.charities?.name || "Not selected"}</strong>
        </p>
        <form className="score-form" onSubmit={savePreference}>
          <select
            value={preferenceForm.charityId}
            onChange={(event) =>
              setPreferenceForm((prev) => ({
                ...prev,
                charityId: event.target.value,
              }))
            }
            required
          >
            <option value="" disabled>
              Select charity
            </option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="10"
            max="100"
            step="1"
            value={preferenceForm.contributionPercent}
            onChange={(event) =>
              setPreferenceForm((prev) => ({
                ...prev,
                contributionPercent: event.target.value,
              }))
            }
            required
          />
          <button type="submit">Save Preference</button>
        </form>
      </section>

      <section className="card">
        <h2>Independent Donation</h2>
        <form className="score-form" onSubmit={submitDonation}>
          <select
            value={donationForm.charityId}
            onChange={(event) =>
              setDonationForm((prev) => ({
                ...prev,
                charityId: event.target.value,
              }))
            }
            required
          >
            <option value="" disabled>
              Select charity
            </option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Amount in INR"
            value={donationForm.amountInr}
            onChange={(event) =>
              setDonationForm((prev) => ({
                ...prev,
                amountInr: event.target.value,
              }))
            }
            required
          />
          <button type="submit">Donate</button>
        </form>

        <ul className="list compact">
          {donations.map((donation) => (
            <li key={donation.id}>
              <strong>{money(donation.amount_inr)}</strong>
              <span>{donation.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
