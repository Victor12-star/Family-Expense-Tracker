// =====================================================================
// Accessibility helper — applies accessibility settings to the whole app
// by adding classes to the <html> element. Settings persist in localStorage.
// =====================================================================

const KEYS = {
  largeText: "fet_a11y_large",
  highContrast: "fet_a11y_contrast",
  reduceMotion: "fet_a11y_motion",
};

// Read saved settings (default all off)
export function getAccessibilitySettings() {
  return {
    largeText: localStorage.getItem(KEYS.largeText) === "1",
    highContrast: localStorage.getItem(KEYS.highContrast) === "1",
    reduceMotion: localStorage.getItem(KEYS.reduceMotion) === "1",
  };
}

// Apply settings to the <html> element (add/remove classes)
export function applyAccessibility(settings) {
  const el = document.documentElement;
  el.classList.toggle("a11y-large", settings.largeText);
  el.classList.toggle("a11y-contrast", settings.highContrast);
  el.classList.toggle("a11y-motion", settings.reduceMotion);
}

// Save a setting and re-apply
export function setAccessibilitySetting(name, value) {
  const key = KEYS[name];
  if (!key) return;
  localStorage.setItem(key, value ? "1" : "0");
  applyAccessibility(getAccessibilitySettings());
}

// Apply once on app load
export function initAccessibility() {
  applyAccessibility(getAccessibilitySettings());
}
