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
    title: "Privacy overview",
    body: <><p>The application stores account details, expenses, budgets, reminders, shopping information, family membership and family messages so its features can work.</p><p>Authentication and application data are handled by the backend and PostgreSQL database. The formal public Privacy Policy, retention schedule, processor list and account-data request process must be completed before public release.</p></>,
  },
  terms: {
    title: "Terms of Service status",
    body: <><p>The final Terms of Service have not been published because this is still a staging build.</p><p>Release is blocked until the terms accurately describe the finished service, user responsibilities, subscriptions, support and applicable Swedish and European Union requirements.</p></>,
  },
  licenses: {
    title: "Open-source licences",
    body: <><p>This application uses open-source software including React, Vite, React Router, Axios, Lucide React, Recharts and Socket.IO Client.</p><p>These packages use their own licences, mainly MIT and similar permissive licences. A complete third-party notice generated from the final locked dependencies will be included before public release.</p></>,
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
        <span className="eyebrow">Account & application</span>
        <h1>Settings</h1>
        <p>Manage the preferences and controls that are available in this release.</p>
      </div>
      {notice && <div className="success-banner settings-notice" role="status">{notice}</div>}

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map(([id, Icon, label]) => (
            <button type="button" key={id} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)} aria-current={activeSection === id ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" /> {label}
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

function PanelHead({ Icon, title, copy }) {
  return <div className="settings-panel-head"><Icon size={22} /><div><h2>{title}</h2><p>{copy}</p></div></div>;
}

function InfoBox({ children }) {
  return <div className="settings-info"><Info size={17} /><p>{children}</p></div>;
}

function AccountPanel({ user }) {
  return <div className="settings-panel"><PanelHead Icon={UserRound} title="Account" copy="Your current account identity." /><div className="account-summary"><span className="account-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</span><div><strong>{user?.name || "User"}</strong><span>{user?.email || "No email available"}</span></div></div><InfoBox>Name and email editing will be added with verified-email protection. This staging version does not show unsaved editing controls.</InfoBox></div>;
}

function PreferencesPanel({ currency, changeCurrency, theme, handleThemeChange }) {
  return <div className="settings-panel"><PanelHead Icon={SlidersHorizontal} title="Preferences" copy="Choose how values and colours appear." /><label className="field"><span>Currency</span><select value={currency} onChange={(event) => changeCurrency(event.target.value)}>{CURRENCY_CODES.map((code) => <option key={code} value={code}>{code} ({CURRENCIES[code]})</option>)}</select></label><label className="field"><span>Theme</span><select value={theme} onChange={handleThemeChange}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>;
}

function NotificationsPanel({ status, requestNotifications, sound, setSound, previewSound }) {
  return <div className="settings-panel"><PanelHead Icon={Bell} title="Notifications" copy="Control browser alerts and reminder sounds." /><div className="setting-action-row"><div><strong>Browser notifications</strong><span>Status: {status}</span></div><button className="btn secondary" type="button" onClick={requestNotifications}>Manage permission</button></div><div className="setting-action-row"><label className="field"><span>Reminder sound</span><select value={sound} onChange={(event) => { setSound(event.target.value); localStorage.setItem(SOUND_KEY, event.target.value); }}><option value="soft">Soft chime</option><option value="bell">Gentle bell</option><option value="digital">Digital</option><option value="none">None</option></select></label><button className="btn secondary" type="button" onClick={previewSound}>Preview</button></div><InfoBox>In-app alarms work while the application is open. Closed-app Web Push delivery is not included yet.</InfoBox></div>;
}

function SecurityPanel({ user, handleLogout }) {
  return <div className="settings-panel"><PanelHead Icon={ShieldCheck} title="Security" copy="Review and end your current session." /><div className="setting-action-row"><div><strong>Current session</strong><span>Signed in as {user?.email}</span></div><span className="status-pill"><CheckCircle2 size={15} /> Active</span></div><button className="btn danger settings-logout" type="button" onClick={handleLogout}><LogOut size={18} /> Log out</button><InfoBox>Password changes, verified email and device-session management require additional secured backend endpoints and will be completed before public release.</InfoBox></div>;
}

function PrivacyPanel({ setLegalPanel }) {
  return <div className="settings-panel"><PanelHead Icon={FileText} title="Privacy & Data" copy="Understand the current data and legal status." /><button className="settings-link-card" type="button" onClick={() => setLegalPanel("privacy")}><FileText size={20} /><span><strong>Privacy overview</strong><small>See what information the application currently uses.</small></span></button><button className="settings-link-card" type="button" onClick={() => setLegalPanel("terms")}><Scale size={20} /><span><strong>Terms of Service</strong><small>Review the staging and public-release status.</small></span></button><InfoBox>Data export and account deletion are not shown as buttons until secure server-side workflows are implemented.</InfoBox></div>;
}

function AccessibilityPanel({ a11y, handleA11yChange }) {
  return <div className="settings-panel"><PanelHead Icon={Accessibility} title="Accessibility" copy="Apply display preferences throughout the application." />{[["largeText", "Larger text"], ["highContrast", "High contrast"], ["reduceMotion", "Reduce motion"]].map(([name, label]) => <label className="toggle-row" key={name}><span>{label}</span><input type="checkbox" className="toggle" checked={a11y[name]} onChange={(event) => handleA11yChange(name, event.target.checked)} /></label>)}</div>;
}

function AboutPanel({ setLegalPanel }) {
  return <div className="settings-panel"><PanelHead Icon={Info} title="About & Support" copy="Application and software information." /><div className="setting-action-row"><div><strong>Family Expense Tracker</strong><span>Version 1.0 staging · Built by Victor Okon</span></div></div><button className="settings-link-card" type="button" onClick={() => setLegalPanel("licenses")}><Scale size={20} /><span><strong>Open-source licences</strong><small>Review the software used to build this application.</small></span></button><InfoBox>A public support address will be displayed here after it is configured and monitored.</InfoBox></div>;
}
