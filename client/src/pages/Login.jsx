// =====================================================================
// Login page
// =====================================================================
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/brand-mark.png" alt="Family Expense Tracker logo" className="auth-logo-img" />
        <div className="auth-app-name">Family Expense Tracker</div>
        <h1>{t("signIn", "Sign in")}</h1>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {location.state?.accountCreated && (
          <div className="success-banner" role="status">Your account is ready. Sign in to continue.</div>
        )}

        <label className="field">
          <span>{t("email", "Email")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>{t("password", "Password")}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? t("loading", "Loading…") : t("signIn", "Sign in")}
        </button>
        <p className="auth-links">
          <Link to="/register">{t("createAccount", "Create account")}</Link>
        </p>
      </form>
    </main>
  );
}
