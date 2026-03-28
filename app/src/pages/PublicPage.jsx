import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function PublicPage() {
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [charityRes, drawRes] = await Promise.all([
          apiRequest("/api/v1/charities"),
          apiRequest("/api/v1/draws"),
        ]);
        setCharities(charityRes.data || []);
        setDraws(drawRes.data || []);
      } catch (err) {
        setError(err.message || "Unable to load public data");
      }
    }

    load();
  }, []);

  return (
    <main className="grid">
      {error ? <div className="flash flash-error wide">{error}</div> : null}
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
                  Winning numbers: {(draw.winning_numbers || []).join(" - ")}
                </p>
              </div>
              <span className="tag">{draw.mode}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
