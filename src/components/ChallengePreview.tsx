import React from 'react';

interface ChallengePreviewProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  setPreviewError: (error: string | null) => void;
}

const ChallengePreview: React.FC<ChallengePreviewProps> = ({ htmlCode, cssCode, jsCode, setPreviewError }) => {
  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Náhľad</h2>
      <div className="border border-gray-700 p-4 h-[400px] overflow-auto bg-white">
        <iframe
          id="preview"
          srcDoc={`
            <html>
              <head>
                <style id="css">${cssCode}</style>
              </head>
              <body id="html">
                ${htmlCode}
              </body>
              <script id="js">
                try {
                  ${jsCode}
                } catch (error) {
                  document.body.innerHTML += '<pre style="color: red;">' + error.toString() + '</pre>';
                }
              </script>
            </html>
          `}
          title="preview"
          className="w-full h-full"
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            const errorElement = iframe.contentDocument?.querySelector("pre");
            if (errorElement) {
              setPreviewError(errorElement.textContent || "Nastala chyba");
            } else {
              setPreviewError(null);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ChallengePreview;
