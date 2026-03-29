import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, error: authError } = useAuth();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "subscriber",
    adminCode: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup") {
        await signUp({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          adminCode: form.adminCode,
        });
        setNotice("Account created successfully.");
      } else {
        await signIn(form.email, form.password);
      }

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
        <h2>{mode === "signin" ? "Sign In" : "Sign Up"}</h2>
        <p>
          {mode === "signin"
            ? "Use your Supabase credentials to access subscriber and admin routes."
            : "Create your account first. New users default to subscriber role."}
        </p>
        <div className="actions">
          <button
            type="button"
            className={mode === "signin" ? "" : "ghost"}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "" : "ghost"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>
        {authError ? (
          <div className="flash flash-error">{authError}</div>
        ) : null}
        {notice ? <div className="flash">{notice}</div> : null}
        {error ? <div className="flash flash-error">{error}</div> : null}
        <form className="score-form" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
            />
          ) : null}
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
          {mode === "signup" ? (
            <>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, role: event.target.value }))
                }
              >
                <option value="subscriber">Subscriber</option>
                <option value="admin">Admin</option>
              </select>
              {form.role === "admin" ? (
                <input
                  type="password"
                  placeholder="Admin signup code"
                  value={form.adminCode}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      adminCode: event.target.value,
                    }))
                  }
                  required
                />
              ) : null}
            </>
          ) : null}
          <button type="submit" disabled={busy}>
            {busy
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
          </button>
        </form>
      </section>
    </main>
  );
}
