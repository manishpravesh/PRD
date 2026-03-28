import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, error: authError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await signIn(form.email, form.password);
      navigate("/subscriber");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid single">
      <section className="card">
        <h2>Sign In</h2>
        <p>
          Use your Supabase credentials to access subscriber and admin routes.
        </p>
        {authError ? (
          <div className="flash flash-error">{authError}</div>
        ) : null}
        {error ? <div className="flash flash-error">{error}</div> : null}
        <form className="score-form" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
