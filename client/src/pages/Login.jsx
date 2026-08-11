// =====================================================================
// Login page
// =====================================================================
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/logo.png" alt="Family Expense Tracker logo" className="auth-logo-img" />
        <h1>Family Expense Tracker</h1>
        <p className="tag">Sign in to your family</p>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <p className="auth-links">
          <Link to="/register">Create account</Link>
        </p>
      </form>
    </main>
  );
}
