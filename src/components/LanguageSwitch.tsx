import React from "react";
import { useI18n } from "../hooks/useI18n";
import { LanguageCode } from "../types/i18n";

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-blue-200">{t("header.language")}:</span>
      <select
        value={language}
        onChange={handleChange}
        className="px-2 py-1 text-xs bg-indigo-800 border border-indigo-700 rounded text-blue-100"
      >
        <option value="auto">{t("header.auto")}</option>
        <option value="en">English</option>
        <option value="sk">Slovenčina</option>
      </select>
    </div>
  );
};

export default LanguageSwitch;
