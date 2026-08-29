// =====================================================================
// Settings — functional account, preference, notification and legal hub.
// Controls are shown only when they perform a real action in this release.
// =====================================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accessibility,
  Bell,
  CheckCircle2,
  FileText,
  Info,
  LogOut,
  Mail,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { CURRENCIES, CURRENCY_CODES } from "../utils/constants.js";
import { playReminderChime } from "../utils/reminderAudio.js";
import { getAccessibilitySettings, setAccessibilitySetting } from "../utils/accessibility.js";

const SOUND_KEY = "fet_reminder_sound";
const THEME_KEY = "fet_theme";
const SUPPORT_EMAIL = String(import.meta.env.VITE_SUPPORT_EMAIL || "victorwisdom39@yahoo.com").trim();
const sections = [
  ["account", UserRound, "Account"],
  ["preferences", SlidersHorizontal, "Preferences"],
  ["notifications", Bell, "Notifications"],
  ["security", ShieldCheck, "Security"],
  ["privacy", FileText, "Privacy & Data"],
  ["accessibility", Accessibility, "Accessibility"],
  ["about", Info, "About & Support"],
];

const legalContent = {
  privacy: {
    title: "Privacy",
    body: <><p>Family Expense Tracker stores the account and financial information needed to provide its features, including expenses, budgets, reminders, shopping lists and family messages.</p><p>Your information is sent to the application server and stored in its database. Do not enter information you do not want shared with members of your family workspace.</p></>,
  },
  terms: {
    title: "Terms of use",
    body: <><p>This is a staging version of Family Expense Tracker for testing. Features may change and the service should not be treated as permanent storage.</p><p>Final public terms will be published before the application is released for general use.</p></>,
  },
  licenses: {
    title: "Open-source licenses",
    body: <><p>Built with React, Vite, React Router, Axios, Lucide React, Recharts and Socket.IO Client.</p><p>These projects are distributed under their respective open-source licenses, primarily the MIT License.</p></>,
  },
};

function readTheme() {
  return localStorage.getItem(THEME_KEY) || "system";
}

function applyTheme(theme) {
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  document.documentElement.classList.toggle("light", theme === "light" || (theme === "system" && prefersLight));
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("account");
  const [theme, setTheme] = useState(readTheme);
  const [sound, setSound] = useState(() => localStorage.getItem(SOUND_KEY) || "soft");
  const [a11y, setA11y] = useState(getAccessibilitySettings());
  const [legalPanel, setLegalPanel] = useState(null);
  const [notice, setNotice] = useState("");
  const notificationStatus = "Notification" in window ? Notification.permission : "unsupported";

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function handleThemeChange(event) {
    const nextTheme = event.target.value;
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  function handleA11yChange(name, value) {
    setAccessibilitySetting(name, value);
    setA11y(getAccessibilitySettings());
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      showNotice("Browser notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    showNotice(permission === "granted" ? "Browser notifications are enabled." : "Browser notifications were not enabled.");
  }

  async function previewSound() {
    const played = await playReminderChime(sound);
    showNotice(played ? "Reminder sound is enabled." : "The browser blocked sound. Click the page and try again.");
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page settings-page">
      <div className="modern-head settings-head">
        <h1>Settings</h1>
        <p>Manage your account and app preferences.</p>
      </div>
      {notice && <div className="success-banner settings-notice" role="status">{notice}</div>}

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map(([id, Icon, label]) => (
            <button type="button" key={id} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)} aria-current={activeSection === id ? "page" : undefined}>
              {label}
            </button>
          ))}
        </nav>

        <section className="settings-content">
          {activeSection === "account" && <AccountPanel user={user} />}
          {activeSection === "preferences" && <PreferencesPanel currency={currency} changeCurrency={changeCurrency} theme={theme} handleThemeChange={handleThemeChange} />}
          {activeSection === "notifications" && <NotificationsPanel status={notificationStatus} requestNotifications={requestNotifications} sound={sound} setSound={setSound} previewSound={previewSound} />}
          {activeSection === "security" && <SecurityPanel user={user} handleLogout={handleLogout} />}
          {activeSection === "privacy" && <PrivacyPanel setLegalPanel={setLegalPanel} />}
          {activeSection === "accessibility" && <AccessibilityPanel a11y={a11y} handleA11yChange={handleA11yChange} />}
          {activeSection === "about" && <AboutPanel setLegalPanel={setLegalPanel} />}
        </section>
      </div>

      <footer className="settings-footer">
        <span>Built by <strong>Victor</strong></span>
        {SUPPORT_EMAIL && (
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            <Mail size={15} aria-hidden="true" /> Contact: {SUPPORT_EMAIL}
          </a>
        )}
      </footer>

      {legalPanel && (
        <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLegalPanel(null); }}>
          <div className="modal-card legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
            <div className="drawer-head"><h2 id="legal-title">{legalContent[legalPanel].title}</h2><button type="button" className="icon-btn" onClick={() => setLegalPanel(null)} aria-label="Close"><X size={20} /></button></div>
            <div className="legal-copy">{legalContent[legalPanel].body}</div>
            <button type="button" className="btn primary" onClick={() => setLegalPanel(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHead({ Icon, title }) {
  return <div className="settings-panel-head"><Icon size={20} /><h2>{title}</h2></div>;
}

function AccountPanel({ user }) {
  return <div className="settings-panel"><PanelHead Icon={UserRound} title="Account" /><div className="account-summary"><span className="account-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</span><div><strong>{user?.name || "User"}</strong><span>{user?.email || "No email available"}</span></div></div></div>;
}

function PreferencesPanel({ currency, changeCurrency, theme, handleThemeChange }) {
  return <div className="settings-panel"><PanelHead Icon={SlidersHorizontal} title="Preferences" /><label className="settings-control-row"><strong>Currency</strong><select value={currency} onChange={(event) => changeCurrency(event.target.value)}>{CURRENCY_CODES.map((code) => <option key={code} value={code}>{code} ({CURRENCIES[code]})</option>)}</select></label><label className="settings-control-row"><strong>Theme</strong><select value={theme} onChange={handleThemeChange}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>;
}

function NotificationsPanel({ status, requestNotifications, sound, setSound, previewSound }) {
  return <div className="settings-panel"><PanelHead Icon={Bell} title="Notifications" /><div className="settings-control-row"><span><strong>Browser notifications</strong><small className="settings-status">{status === "granted" ? "Allowed" : status === "denied" ? "Blocked" : status === "unsupported" ? "Not supported" : "Not enabled"}</small></span>{status !== "unsupported" && <button className="btn secondary small" type="button" onClick={requestNotifications}>{status === "granted" ? "Check" : "Allow"}</button>}</div><div className="settings-control-row"><strong>Reminder sound</strong><div className="settings-inline-control"><select value={sound} onChange={(event) => { setSound(event.target.value); localStorage.setItem(SOUND_KEY, event.target.value); }}><option value="soft">Soft chime</option><option value="bell">Gentle bell</option><option value="digital">Digital</option><option value="none">None</option></select><button className="btn secondary small" type="button" onClick={previewSound}>Preview</button></div></div></div>;
}

function SecurityPanel({ user, handleLogout }) {
  return <div className="settings-panel"><PanelHead Icon={ShieldCheck} title="Security" /><div className="settings-control-row"><span><strong>Current session</strong><small>{user?.email}</small></span><span className="status-pill"><CheckCircle2 size={14} /> Active</span></div><div className="settings-control-row"><span><strong>Log out</strong><small>End this session on this device</small></span><button className="btn danger settings-logout" type="button" onClick={handleLogout}><LogOut size={16} /> Log out</button></div></div>;
}

function PrivacyPanel({ setLegalPanel }) {
  return <div className="settings-panel"><PanelHead Icon={FileText} title="Privacy & Data" /><button className="settings-link-card" type="button" onClick={() => setLegalPanel("privacy")}><FileText size={18} /><span><strong>Privacy</strong></span></button><button className="settings-link-card" type="button" onClick={() => setLegalPanel("terms")}><Scale size={18} /><span><strong>Terms of use</strong></span></button></div>;
}

function AccessibilityPanel({ a11y, handleA11yChange }) {
  return <div className="settings-panel"><PanelHead Icon={Accessibility} title="Accessibility" />{[["largeText", "Larger text"], ["highContrast", "High contrast"], ["reduceMotion", "Reduce motion"]].map(([name, label]) => <label className="settings-control-row" key={name}><strong>{label}</strong><input type="checkbox" className="toggle" checked={a11y[name]} onChange={(event) => handleA11yChange(name, event.target.checked)} /></label>)}</div>;
}

function AboutPanel({ setLegalPanel }) {
  return <div className="settings-panel"><PanelHead Icon={Info} title="About" /><div className="settings-control-row"><span><strong>Family Expense Tracker</strong><small>Version 1.0 staging</small></span></div><button className="settings-link-card" type="button" onClick={() => setLegalPanel("licenses")}><Scale size={18} /><span><strong>Open-source licenses</strong></span></button></div>;
}
