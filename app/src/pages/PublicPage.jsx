import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function PublicPage() {
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("q", search.trim());
        }
        if (featuredOnly) {
          params.set("featured", "true");
        }

        const query = params.toString() ? `?${params.toString()}` : "";

        const [charityRes, drawRes] = await Promise.all([
          apiRequest(`/api/v1/charities${query}`),
          apiRequest("/api/v1/draws"),
        ]);
        setCharities(charityRes.data || []);
        setDraws(drawRes.data || []);
      } catch (err) {
        setError(err.message || "Unable to load public data");
      }
    }

    load();
  }, [search, featuredOnly]);

  return (
    <main className="grid">
      {error ? <div className="flash flash-error wide">{error}</div> : null}
      <section className="card">
        <h2>Featured Charities</h2>
        <div className="score-form">
          <input
            type="text"
            placeholder="Search charities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className={featuredOnly ? "" : "ghost"}
            onClick={() => setFeaturedOnly((prev) => !prev)}
          >
            {featuredOnly ? "Featured Only" : "All Charities"}
          </button>
        </div>
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
