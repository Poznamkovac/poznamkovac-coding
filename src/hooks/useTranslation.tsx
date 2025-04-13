import React from "react";
import { useI18n } from "./useI18n";

// Higher order component to provide translation capability
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: (key: string) => string }>,
): React.FC<P> {
  const WithTranslation = (props: P) => {
    const { t } = useI18n();
    return React.createElement(Component, { ...props, t });
  };

  const displayName = Component.displayName || Component.name || "Component";
  WithTranslation.displayName = `withTranslation(${displayName})`;

  return WithTranslation;
}
