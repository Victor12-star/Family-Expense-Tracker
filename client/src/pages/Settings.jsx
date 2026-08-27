import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { CURRENCIES, CURRENCY_CODES } from "../utils/constants.js";
import {
  getAccessibilitySettings,
  setAccessibilitySetting,
} from "../utils/accessibility.js";

export default function Settings() {
  const { user } = useAuth();
  const { currency, changeCurrency } = useCurrency();
  const [theme, setTheme] = useState("dark");
  const [a11y, setA11y] = useState(getAccessibilitySettings());

  function handleThemeChange(e) {
    const t = e.target.value;
    setTheme(t);
    localStorage.setItem("fet_theme", t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }

  function handleA11yChange(name, value) {
    setAccessibilitySetting(name, value);
    setA11y(getAccessibilitySettings());
  }

  return (
    <div className="page">
      <div className="page-head"><h2>Settings</h2></div>

      <div className="card">
        <h3>Profile</h3>
        <label className="field"><span>Name</span><input defaultValue={user?.name} /></label>
        <label className="field"><span>Email</span><input defaultValue={user?.email} /></label>
      </div>

      <div className="card">
        <h3>Preferences</h3>
        <label className="field"><span>Currency</span>
          <select value={currency} onChange={(e) => changeCurrency(e.target.value)}>
            {CURRENCY_CODES.map((c) => (
              <option key={c} value={c}>{c} ({CURRENCIES[c]})</option>
            ))}
          </select>
        </label>
        <label className="field"><span>Theme</span>
          <select value={theme} onChange={handleThemeChange}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <div className="toggle-row">
          <span>Push notifications</span>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>
        <div className="toggle-row">
          <span>Email alerts</span>
          <input type="checkbox" className="toggle" />
        </div>
      </div>

      <div className="card">
        <h3>Accessibility</h3>
        <div className="toggle-row">
          <span>Larger text</span>
          <input
            type="checkbox"
            className="toggle"
            checked={a11y.largeText}
            onChange={(e) => handleA11yChange("largeText", e.target.checked)}
          />
        </div>
        <div className="toggle-row">
          <span>High contrast</span>
          <input
            type="checkbox"
            className="toggle"
            checked={a11y.highContrast}
            onChange={(e) => handleA11yChange("highContrast", e.target.checked)}
          />
        </div>
        <div className="toggle-row">
          <span>Reduce motion</span>
          <input
            type="checkbox"
            className="toggle"
            checked={a11y.reduceMotion}
            onChange={(e) => handleA11yChange("reduceMotion", e.target.checked)}
          />
        </div>
      </div>

      <div className="card">
        <h3>About</h3>
        <p className="subtitle">Version 1.0 · Built by <strong>Victor Okon</strong></p>
      </div>
    </div>
  );
}
