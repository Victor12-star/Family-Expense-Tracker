// =====================================================================
// Register page
// =====================================================================
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

function registrationErrorMessage(error) {
  const details = error.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item) => item.message).join(". ");
  }
  return error.response?.data?.message || "Registration failed. Please check your details.";
}

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!PASSWORD_RULE.test(password)) {
      setError("Password must be 8 to 72 characters and include an uppercase letter, a lowercase letter, and a number.");
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Registration returns a complete session, so enter the application
      // immediately instead of sending the new user through login again.
      navigate("/", { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("The app could not reach the registration server. Please wait a moment and try again.");
      } else {
        setError(registrationErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/brand-mark.png" alt="Family Expense Tracker logo" className="auth-logo-img" />
        <h1>{t("createAccount", "Create account")}</h1>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <label className="field">
          <span>{t("name", "Name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} minLength="1" maxLength="60" autoComplete="name" required />
        </label>
        <label className="field">
          <span>{t("email", "Email")}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>{t("password", "Password")}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength="8" maxLength="72" autoComplete="new-password" aria-describedby="password-rules" required />
          <small id="password-rules">8 to 72 characters with uppercase, lowercase, and a number</small>
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? t("loading", "Loading…") : t("createAccount", "Create account")}
        </button>
        <p className="auth-links">
          <Link to="/login">Already have an account? Sign in</Link>
        </p>
      </form>
    </main>
  );
}
