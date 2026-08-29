import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switch" role="group" aria-label="Language / Språk">
      <Languages size={17} aria-hidden="true" />
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
      <button type="button" className={language === "sv" ? "active" : ""} onClick={() => setLanguage("sv")} aria-pressed={language === "sv"}>SV</button>
    </div>
  );
}
