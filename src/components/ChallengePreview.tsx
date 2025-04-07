import type React from "react";
import { useEffect, useRef } from "react";

interface ChallengePreviewProps {
  htmlKod: string;
  cssKod: string;
  jsKod: string;
}

const ChallengePreview: React.FC<ChallengePreviewProps> = ({ htmlKod, cssKod, jsKod }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const updateIframeContent = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      // vloží CSS
      let styleElement = iframeDoc.getElementById("injected-css");
      if (!styleElement) {
        styleElement = iframeDoc.createElement("style");
        styleElement.id = "injected-css";
        iframeDoc.head.appendChild(styleElement);
      }
      styleElement.textContent = cssKod;

      // vloží JavaScript
      let scriptElement = iframeDoc.getElementById("injected-js");
      if (!scriptElement) {
        scriptElement = iframeDoc.createElement("script");
        scriptElement.id = "injected-js";
        iframeDoc.body.appendChild(scriptElement);
      }
      scriptElement.textContent = `
        try {
          ${jsKod}
        } catch (error) {
          document.body.innerHTML = '<pre id="chyba" style="color: red;">' + error.toString() + '</pre>' + document.body.innerHTML;
        }
      `;
    };

    iframe.srcdoc = htmlKod;
    iframe.onload = updateIframeContent;
  }, [htmlKod, cssKod, jsKod]);

  return (
    <div className="flex-1 flex flex-col mb-4">
      <h2 className="mb-1 text-xl font-semibold">Náhľad</h2>
      <div className="flex-1 border border-gray-700 p-4 bg-white overflow-auto min-h-0">
        <iframe ref={iframeRef} id="preview" title="preview" className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChallengePreview;
