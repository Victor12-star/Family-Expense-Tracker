import { useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function Family() {
  const { family, loadFamily } = useFamily();
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState("");

  async function createFamily(e) {
    e.preventDefault();
    const res = await api.post("/families", { name: familyName });
    await loadFamily(res.data.id);
  }

  async function joinFamily(e) {
    e.preventDefault();
    const res = await api.post("/families/join", { inviteCode });
    await loadFamily(res.data.id);
  }

  // Check if the current user is the OWNER of this family
  const isOwner = family?.members?.some(
    (m) => m.userId === user?.id && m.role === "OWNER"
  );

  // The lifetime invite link (only the owner sees this)
  const inviteLink = `${window.location.origin}/join/${family?.inviteCode || ""}`;

  function copyText(text, which) {
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="page">
      <div className="page-head"><h2>Family</h2></div>

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

          {/* Only the OWNER sees the invite link/code */}
          {isOwner && (
            <div className="invite-box">
              <p className="subtitle">
                🔗 <strong>Invite link (stays valid forever)</strong> — share this with family members:
              </p>
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
              <p className="subtitle">Only the family owner can generate the invite link.</p>
            </div>
          )}

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