import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { hasSupabaseConfig, supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = session?.access_token || "";

  async function bootstrapProfile(
    nextToken,
    { fullName, role, adminCode } = {},
  ) {
    if (!nextToken) return null;

    const response = await apiRequest("/api/v1/auth/bootstrap", {
      method: "POST",
      token: nextToken,
      body: {
        fullName,
        role: role || "subscriber",
        adminCode,
      },
    });

    return response.data?.profile || null;
  }

  async function refreshProfile(nextToken) {
    if (!nextToken) {
      setProfile(null);
      return;
    }

    try {
      const result = await apiRequest("/api/v1/auth/me", { token: nextToken });
      let nextProfile = result.data?.profile || null;

      if (!nextProfile && result.data?.needsProfileSetup) {
        nextProfile = await bootstrapProfile(nextToken, {
          role: "subscriber",
        });
      }

      setProfile(nextProfile);
      setError("");
    } catch (err) {
      setProfile(null);
      setError(err.message || "Unable to load profile");
    }
  }

  useEffect(() => {
    let unsubscribed = false;

    async function init() {
      if (!hasSupabaseConfig || !supabase) {
        setError(
          "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend env",
        );
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (unsubscribed) return;

      setSession(data.session || null);
      await refreshProfile(data.session?.access_token || "");
      setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          setSession(nextSession || null);
          await refreshProfile(nextSession?.access_token || "");
        },
      );

      return () => listener.subscription.unsubscribe();
    }

    let cleanup;
    init().then((cb) => {
      cleanup = cb;
    });

    return () => {
      unsubscribed = true;
      if (cleanup) cleanup();
    };
  }, []);

  async function signIn(email, password) {
    if (!supabase) {
      throw new Error("Supabase is not configured");
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );
    if (signInError) {
      throw new Error(signInError.message);
    }

    const nextToken = data?.session?.access_token;
    if (nextToken) {
      await refreshProfile(nextToken);
    }
  }

  async function signUp({ email, password, fullName, role, adminCode }) {
    if (!supabase) {
      throw new Error("Supabase is not configured");
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    const nextToken = data?.session?.access_token;
    if (!nextToken) {
      throw new Error(
        "Signup successful. Confirm your email first, then sign in.",
      );
    }

    await bootstrapProfile(nextToken, { fullName, role, adminCode });
    await refreshProfile(nextToken);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      loading,
      error,
      session,
      token,
      profile,
      role: profile?.role || null,
      signIn,
      signUp,
      signOut,
      isAuthenticated: Boolean(session?.access_token),
    }),
    [loading, error, session, token, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
