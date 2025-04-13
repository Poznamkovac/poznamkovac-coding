import React from "react";
import { withTranslation } from "../hooks/useTranslation";

interface FooterProps {
  // The t function will be injected by the HOC
  t: (key: string) => string;
}

class Footer extends React.Component<FooterProps> {
  render() {
    const { t } = this.props;

    return (
      <footer className="p-4 mt-8 text-center text-white bg-indigo-900">
        <p>
          {t("app.title")} &copy; {new Date().getFullYear()}
        </p>
      </footer>
    );
  }
}

// Wrap the component with the translation HOC
const TranslatedFooter = withTranslation(Footer);
export default TranslatedFooter;
