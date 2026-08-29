import { Languages } from "lucide-react";
import { LANGUAGES, useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="language-switch" aria-label="Language">
      <Languages size={17} aria-hidden="true" />
      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
        {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
  );
}
