// =====================================================================
// Register page
// =====================================================================
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(name, email, password);
      // Registration returns a complete session, so enter the application
      // immediately instead of sending the new user through login again.
      navigate("/", { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("The app could not reach the registration server. Please wait a moment and try again.");
      } else {
        setError(err.response.data?.message || "Registration failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">👨‍👩‍👧‍👦</div>
        <img src="/brand-mark.png" alt="Family Expense Tracker logo" className="auth-logo-img" />
        <h1>Create account</h1>
        <p className="tag">Join Family Expense Tracker</p>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <small>8+ chars, upper &amp; lower case, a number</small>
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? "Creating…" : "Create Account"}
        </button>
        <p className="auth-links">
          <Link to="/login">Already have an account? Sign in</Link>
        </p>
      </form>
    </main>
  );
}
