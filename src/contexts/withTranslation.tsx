import React from "react";
import { useI18n } from "../hooks/useI18n";

/**
 * Higher Order Component that provides translation functions to wrapped components
 * This eliminates the need to call useI18n() in every component
 *
 * @param Component The component to wrap
 * @returns A new component with translation props
 */
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: (key: string) => string }>
): React.FC<P> {
  // Create a new component that gets translations and passes them to the wrapped component
  const WithTranslation: React.FC<P> = (props) => {
    // Use our translation hook
    const { t } = useI18n();

    // Pass the translation function to the component
    return <Component {...props} t={t} />;
  };

  // Update display name for debugging
  const displayName = Component.displayName || Component.name || "Component";
  WithTranslation.displayName = `withTranslation(${displayName})`;

  return WithTranslation;
}

/**
 * Optional decorator syntax for TypeScript classes
 * Example usage:
 *
 * @TranslationProvider
 * class MyComponent extends React.Component<Props> {
 *   render() {
 *     return <div>{this.props.t('key')}</div>;
 *   }
 * }
 */
export function TranslationProvider<P extends object>(
  Target: React.ComponentType<P & { t: (key: string) => string }>
): React.FC<P> {
  return withTranslation(Target);
}
