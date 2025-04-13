import React, { useContext } from "react";
import { I18nContext } from "./I18nContext";

// TranslationExample is a simple component that demonstrates
// how to use translation in a functional component
export const TranslationExample: React.FC = () => {
  const { t } = useContext(I18nContext);

  return <div>{t("common.loading")}</div>;
};
