import { NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import PublicPage from "./pages/PublicPage";
import SubscriberPage from "./pages/SubscriberPage";
import "./App.css";

function Navigation() {
  const { isAuthenticated, role, signOut } = useAuth();

  return (
    <nav className="top-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Public
      </NavLink>
      <NavLink
        to="/subscriber"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Subscriber
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        Admin
      </NavLink>
      <div className="spacer" />
      {isAuthenticated ? (
        <>
          <span className="role-pill">{role || "authenticated"}</span>
          <button type="button" className="ghost" onClick={signOut}>
            Sign Out
          </button>
        </>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Sign In
        </NavLink>
      )}
    </nav>
  );
}

export default function App() {
  const { error } = useAuth();

  return (
    <div className="shell">
      <header className="hero-panel">
        <div className="brand-kicker">Digital Heroes Challenge Build</div>
        <h1>Play For Better</h1>
        <p>
          Subscription + draw + charity in one modern workflow. This build now
          uses route-level pages and Supabase session auth.
        </p>
        <Navigation />
      </header>

      {error ? <div className="flash flash-error">{error}</div> : null}

      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/subscriber"
          element={
            <ProtectedRoute allowRoles={["subscriber", "admin"]}>
              <SubscriberPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
