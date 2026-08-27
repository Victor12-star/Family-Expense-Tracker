import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Check,
  Clock3,
  Copy,
  Crown,
  Link,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useFamily } from "../context/FamilyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "24 hours", value: 24 },
  { label: "7 days", value: 168 },
  { label: "No expiry", value: "" },
];

const USE_OPTIONS = [
  { label: "1 person", value: 1 },
  { label: "5 people", value: 5 },
  { label: "Unlimited", value: "" },
];

function initials(name = "Family") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "F";
}

function inviteStatus(invite) {
  if (invite.revokedAt) return "Revoked";
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return "Expired";
  if (invite.maxUses != null && invite.uses >= invite.maxUses) return "Used";
  return "Active";
}

function formatExpiry(invite) {
  if (!invite.expiresAt) return "No expiry";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(invite.expiresAt));
}

export default function Family() {
  const { family, loadFamily, refreshFamilies } = useFamily();
  const { user } = useAuth();
  const [mode, setMode] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [invites, setInvites] = useState([]);
  const [expiresInHours, setExpiresInHours] = useState(168);
  const [maxUses, setMaxUses] = useState(5);
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const membership = useMemo(
    () => family?.members?.find((member) => member.userId === user?.id),
    [family, user?.id]
  );
  const canManage = membership?.role === "OWNER" || membership?.role === "ADMIN";

  async function refreshCurrentFamily() {
    if (!family?.id) return;
    await loadFamily(family.id);
  }

  async function loadInvites() {
    if (!family?.id || !canManage) {
      setInvites([]);
      return;
    }
    try {
      const res = await api.get(`/families/${family.id}/invites`);
      setInvites(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load invitations.");
    }
  }

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id, canManage]);

  async function createFamily(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/families", { name: familyName.trim() });
      await loadFamily(res.data.id);
      await refreshFamilies();
      setFamilyName("");
      setMode(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the family.");
    } finally {
      setBusy(false);
    }
  }

  async function joinFamily(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/families/join", { inviteCode: inviteCode.trim() });
      await loadFamily(res.data.id);
      await refreshFamilies();
      setInviteCode("");
      setMode(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join this family.");
    } finally {
      setBusy(false);
    }
  }

  async function createInvite() {
    if (!family?.id) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/families/${family.id}/invites`, {
        expiresInHours: expiresInHours === "" ? null : Number(expiresInHours),
        maxUses: maxUses === "" ? null : Number(maxUses),
      });
      setInvites((current) => [res.data, ...current]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(inviteId) {
    if (!family?.id) return;
    if (!window.confirm("Revoke this invitation? Anyone with this code or link will no longer be able to use it.")) return;
    setError("");
    try {
      const res = await api.delete(`/families/${family.id}/invites/${inviteId}`);
      setInvites((current) => current.map((item) => (item.id === inviteId ? res.data : item)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not revoke invitation.");
    }
  }

  async function removeMember(member) {
    if (!family?.id || member.role === "OWNER") return;
    if (!window.confirm(`Remove ${member.user.name} from ${family.name}?`)) return;
    setError("");
    try {
      await api.delete(`/families/${family.id}/members/${member.userId}`);
      await refreshCurrentFamily();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove this member.");
    }
  }

  async function changeRole(member, role) {
    if (!family?.id || member.role === "OWNER") return;
    setError("");
    try {
      await api.patch(`/families/${family.id}/members`, { userId: member.userId, role });
      await refreshCurrentFamily();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this member.");
    }
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1600);
    } catch (_) {
      setError("Copy is unavailable in this browser. Select and copy the invitation manually.");
    }
  }

  function inviteLink(invite) {
    return `${window.location.origin}/join/${encodeURIComponent(invite.code)}`;
  }

  if (!family) {
    return (
      <div className="page family-page">
        <div className="page-head family-page-head">
          <div>
            <span className="eyebrow">Family space</span>
            <h2>Connect your family</h2>
            <p className="subtitle">Create a private shared space for expenses, shopping and family conversations.</p>
          </div>
        </div>

        {error && <div className="notice error" role="alert">{error}</div>}

        {!mode && (
          <div className="family-onboarding-grid">
            <button className="family-choice-card" type="button" onClick={() => setMode("create")}>
              <span className="feature-icon"><UsersRound size={24} /></span>
              <strong>Create a family</strong>
              <span>Start a new family space and invite the people you trust.</span>
            </button>
            <button className="family-choice-card" type="button" onClick={() => setMode("join")}>
              <span className="feature-icon"><UserPlus size={24} /></span>
              <strong>Join a family</strong>
              <span>Use a secure invitation code sent by an existing family owner or admin.</span>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form className="card family-action-card" onSubmit={createFamily}>
            <div className="section-heading">
              <div>
                <h3>Create a family</h3>
                <p className="subtitle">You will become the owner and can invite members afterwards.</p>
              </div>
              <button className="icon-btn" type="button" onClick={() => setMode(null)} aria-label="Close create family form"><X size={19} /></button>
            </div>
            <label className="field">
              <span>Family name</span>
              <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} maxLength={60} placeholder="e.g. The Okon Family" required autoFocus />
            </label>
            <div className="form-actions">
              <button className="btn secondary" type="button" onClick={() => setMode(null)}>Cancel</button>
              <button className="btn primary" type="submit" disabled={busy || !familyName.trim()}>{busy ? "Creating…" : "Create family"}</button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form className="card family-action-card" onSubmit={joinFamily}>
            <div className="section-heading">
              <div>
                <h3>Join a family</h3>
                <p className="subtitle">Enter the invitation code exactly as it was shared with you.</p>
              </div>
              <button className="icon-btn" type="button" onClick={() => setMode(null)} aria-label="Close join family form"><X size={19} /></button>
            </div>
            <label className="field">
              <span>Invite code</span>
              <input className="invite-entry" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="e.g. 7H4K9P2M" required autoFocus autoCapitalize="characters" autoComplete="off" />
            </label>
            <div className="form-actions">
              <button className="btn secondary" type="button" onClick={() => setMode(null)}>Cancel</button>
              <button className="btn primary" type="submit" disabled={busy || !inviteCode.trim()}>{busy ? "Joining…" : "Join family"}</button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="page family-page">
      <div className="family-hero card">
        <div className="family-identity">
          <div className="family-avatar" aria-hidden="true">{initials(family.name)}</div>
          <div>
            <span className="eyebrow">Your family</span>
            <h2>{family.name}</h2>
            <p className="subtitle">
              {family.members?.length || 0} {(family.members?.length || 0) === 1 ? "member" : "members"}
              {membership?.role ? ` · You are ${membership.role.toLowerCase()}` : ""}
            </p>
          </div>
        </div>
        <RouterLink className="btn primary" to="/chat"><MessageCircle size={18} /> Open family chat</RouterLink>
      </div>

      {error && <div className="notice error" role="alert">{error}</div>}

      <div className="family-management-grid">
        <section className="card family-panel">
          <div className="section-heading">
            <div>
              <h3>Members</h3>
              <p className="subtitle">People who currently have access to this family space.</p>
            </div>
            <span className="count-pill">{family.members?.length || 0}</span>
          </div>

          <div className="member-list">
            {family.members?.map((member) => {
              const isMe = member.userId === user?.id;
              const isOwner = member.role === "OWNER";
              return (
                <div className="member-row" key={member.id}>
                  <div className="member-profile">
                    <div className="member-avatar">{initials(member.user.name)}</div>
                    <div>
                      <strong>{member.user.name}{isMe ? " (you)" : ""}</strong>
                      <span>{member.user.email}</span>
                    </div>
                  </div>
                  <div className="member-actions">
                    <span className={`role-badge role-${member.role.toLowerCase()}`}>
                      {isOwner ? <Crown size={14} /> : <ShieldCheck size={14} />}{member.role}
                    </span>
                    {canManage && !isOwner && !isMe && (
                      <>
                        <select
                          className="compact-select"
                          aria-label={`Role for ${member.user.name}`}
                          value={member.role}
                          onChange={(event) => changeRole(member, event.target.value)}
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button className="icon-btn danger" type="button" onClick={() => removeMember(member)} aria-label={`Remove ${member.user.name}`}><Trash2 size={17} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(family.members?.length || 0) === 1 && canManage && (
            <div className="family-empty-inline">
              <UserPlus size={21} />
              <div><strong>It's just you for now</strong><span>Create an invitation to bring your family into the shared space.</span></div>
            </div>
          )}
        </section>

        <section className="card family-panel invite-panel">
          <div className="section-heading">
            <div>
              <h3>Invitations</h3>
              <p className="subtitle">Secure codes and links for joining this family.</p>
            </div>
            {canManage && <button className="icon-btn" type="button" onClick={loadInvites} aria-label="Refresh invitations"><RefreshCw size={18} /></button>}
          </div>

          {!canManage ? (
            <div className="family-empty-inline"><ShieldCheck size={21} /><div><strong>Managed by your family owner</strong><span>Owners and admins create or revoke invitation links.</span></div></div>
          ) : (
            <>
              <div className="invite-builder">
                <label className="field compact-field">
                  <span>Expires</span>
                  <select value={expiresInHours} onChange={(event) => setExpiresInHours(event.target.value === "" ? "" : Number(event.target.value))}>
                    {EXPIRY_OPTIONS.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="field compact-field">
                  <span>Uses</span>
                  <select value={maxUses} onChange={(event) => setMaxUses(event.target.value === "" ? "" : Number(event.target.value))}>
                    {USE_OPTIONS.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <button className="btn primary" type="button" onClick={createInvite} disabled={busy}><UserPlus size={17} /> {busy ? "Creating…" : "Create invite"}</button>
              </div>

              <div className="invite-list">
                {invites.length === 0 ? (
                  <div className="family-empty-inline"><Link size={21} /><div><strong>No active invitations yet</strong><span>Create a time-limited code or link when you are ready to invite someone.</span></div></div>
                ) : invites.map((invite) => {
                  const status = inviteStatus(invite);
                  const link = inviteLink(invite);
                  return (
                    <article className={`invite-card invite-${status.toLowerCase()}`} key={invite.id}>
                      <div className="invite-card-top">
                        <div>
                          <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
                          <code>{invite.code}</code>
                        </div>
                        {status === "Active" && <button className="icon-btn danger" type="button" onClick={() => revokeInvite(invite.id)} aria-label="Revoke invitation"><Trash2 size={17} /></button>}
                      </div>
                      <div className="invite-meta">
                        <span><Clock3 size={14} /> {formatExpiry(invite)}</span>
                        <span>{invite.maxUses == null ? `${invite.uses} uses · unlimited` : `${invite.uses}/${invite.maxUses} used`}</span>
                      </div>
                      <div className="invite-actions">
                        <button className="btn secondary small" type="button" onClick={() => copyText(invite.code, `code-${invite.id}`)}>
                          {copied === `code-${invite.id}` ? <Check size={16} /> : <Copy size={16} />}
                          {copied === `code-${invite.id}` ? "Copied" : "Copy code"}
                        </button>
                        <button className="btn secondary small" type="button" onClick={() => copyText(link, `link-${invite.id}`)}>
                          {copied === `link-${invite.id}` ? <Check size={16} /> : <Link size={16} />}
                          {copied === `link-${invite.id}` ? "Copied" : "Copy link"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
