
import { useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";

export default function Family() {
  const { family, loadFamily } = useFamily();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function createFamily(e) {
    e.preventDefault();
    setError("");
    if (!familyName.trim()) {
      setError("Please enter a family name.");
      return;
    }
    try {
      const res = await api.post("/families", { name: familyName.trim() });
      await loadFamily(res.data.id);
      setFamilyName("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create family.");
    }
  }

  async function joinFamily(e) {
    e.preventDefault();
    setError("");
    if (!inviteCode.trim()) {
      setError("Please enter an invite code.");
      return;
    }
    try {
      const res = await api.post("/families/join", { inviteCode: inviteCode.trim() });
      await loadFamily(res.data.id);
      setInviteCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not join family.");
    }
  }

  const inviteLink = `${window.location.origin}/join/${family?.inviteCode || ""}`;

  function copyText(text, which) {
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="page">
      <div className="page-head"><h2>Family</h2></div>

      {error && <div className="error-banner">{error}</div>}

      {!family && (
        <>
          <form className="card expense-form" onSubmit={createFamily}>
            <h3>Create a family</h3>
            <label className="field"><span>Family name</span>
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
            </label>
            <button className="btn primary" type="submit">Create</button>
          </form>

          <form className="card expense-form" onSubmit={joinFamily}>
            <h3>Join with invite code</h3>
            <label className="field"><span>Invite code</span>
              <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
            </label>
            <button className="btn secondary" type="submit">Join</button>
          </form>
        </>
      )}

      {family && (
        <div className="card">
          <h3>{family.name}</h3>
          <div className="invite-box">
            <p className="subtitle">🔗 <strong>Invite link (stays valid forever)</strong> — share this with family members:</p>
            <div className="invite-row">
              <input className="invite-link-input" readOnly value={inviteLink} />
              <button className="btn secondary" onClick={() => copyText(inviteLink, "link")}>
                {copied === "link" ? "✅ Copied!" : "🔗 Copy link"}
              </button>
            </div>
            <div className="invite-row">
              <code className="invite-code">{family.inviteCode}</code>
              <button className="btn secondary" onClick={() => copyText(family.inviteCode, "code")}>
                {copied === "code" ? "✅ Copied!" : "📋 Copy code"}
              </button>
            </div>
          </div>
          <h4 style={{ margin: "16px 0 8px" }}>Members</h4>
          {family.members?.map((m) => (
            <div className="list-item" key={m.id}>
              <span className="li-title">{m.user.name}</span>
              <span className="badge">{m.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}