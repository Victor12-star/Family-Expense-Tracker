
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";

export default function Join() {
  const { code } = useParams();          // the invite code from the URL
    const { loadFamily } = useFamily();
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState(code || "");
    const [message, setMessage] = useState("");

    useEffect(() => {
    if (code) setInviteCode(code);
    }, [code]);

    async function joinFamily(e) {
    e.preventDefault();
    setMessage("");
    try {
        const res = await api.post("/families/join", { inviteCode });
        await loadFamily(res.data.id);
        setMessage("✅ You've joined the family!");
        setTimeout(() => navigate("/"), 1200);
    } catch (err) {
        setMessage("❌ " + (err.response?.data?.message || "Could not join"));
    }
    }

    return (
    <main className="auth-screen">
        <form className="auth-card" onSubmit={joinFamily}>
        <div className="auth-logo">👨‍👩‍👧‍👦</div>
        <h1>Join a family</h1>
        <p className="tag">You've been invited — enter the code to join</p>

        {message && <div className="error-banner">{message}</div>}

        <label className="field">
            <span>Invite code</span>
            <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            />
        </label>

        <button className="btn primary" type="submit">Join family</button>
        <p className="auth-links">
            <Link to="/">Back to home</Link>
        </p>
        </form>
    </main>
    );
}