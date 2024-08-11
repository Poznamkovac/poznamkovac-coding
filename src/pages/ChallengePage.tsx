import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";

interface ChallengeData {
  name: string;
  description: string;
  initialCode: {
    html: string | null;
    css: string | null;
    js: string | null;
  };
}

interface Test {
  score: number;
  details_pass?: string;
  details_fail?: string;
}

const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams<{
    categoryId: string;
    challengeId: string;
  }>();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [cssCode, setCssCode] = useState<string>("");
  const [jsCode, setJsCode] = useState<string>("");
  const [_, setPreviewError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Array<{ name: string; result: Test }>>([]);

  useEffect(() => {
    fetch(`/data/challenges/${categoryId}/${challengeId}.json`)
      .then((response) => response.json())
      .then((data) => {
        setChallengeData(data);
        setHtmlCode(data.initialCode.html || "");
        setCssCode(data.initialCode.css || "");
        setJsCode(data.initialCode.js || "");
      })
      .catch((error) => console.error("Chyba pri načítavaní údajov úlohy:", error));
  }, [categoryId, challengeId]);

  const handleCodeChange = (language: string, value: string | undefined) => {
    if (value === undefined) return;
    switch (language) {
      case "html":
        setHtmlCode(value);
        break;
      case "css":
        setCssCode(value);
        break;
      case "js":
        setJsCode(value);
        break;
    }
    setPreviewError(null);
  };

  const runTests = async () => {
    try {
      const testModule = await import(/* @vite-ignore */ `/data/challenges/${categoryId}/${challengeId}.js`);
      const tester = new testModule.default();

      const parser = new DOMParser();
      const virtualDOM = parser.parseFromString(htmlCode, "text/html");

      const style = document.createElement("style");
      style.textContent = cssCode;
      virtualDOM.head.appendChild(style);

      const script = virtualDOM.createElement("script");
      script.textContent = `
        try {
          ${jsCode}
        } catch (error) {
          document.body.innerHTML += '<pre>Chyba: ' + error.toString() + '</pre>';
        }
      `;
      virtualDOM.body.appendChild(script);

      const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tester)).filter(
        (prop) => prop.startsWith("test_") && typeof tester[prop] === "function"
      );

      const results = await Promise.all(
        testMethods.map(async (method) => {
          try {
            const result: Test = await tester[method](virtualDOM);
            return { name: method, result };
          } catch (error) {
            console.error(`Chyba v metóde: ${method}:`, error);
            return {
              name: method,
              result: { score: 0, details_fail: "Chyba pri spúštaní testov" },
            };
          }
        })
      );

      setTestResults(results);
    } catch (error) {
      console.error("Chyba pri spúštaní testov", error);
      setTestResults([
        {
          name: "Error",
          result: { score: 0, details_fail: "Nastala chyba pri testovaní." },
        },
      ]);
    }
  };

  const renderEditor = (language: string, code: string, setCode: (value: string) => void) => (
    <div className="mb-4">
      <h2 className="mb-2 text-xl font-semibold">{language.toUpperCase()}</h2>
      <CodeEditor
        language={language}
        value={code}
        onChange={(value) => {
          setCode(value || "");
          handleCodeChange(language, value);
        }}
      />
    </div>
  );

  if (!challengeData) return <div>Načítavam...</div>;

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        <h2 className="mb-4 text-3xl font-bold">{challengeData.name}</h2>
        <p className="mb-6">{challengeData.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {challengeData.initialCode.html !== null && renderEditor("html", htmlCode, setHtmlCode)}
            {challengeData.initialCode.css !== null && renderEditor("css", cssCode, setCssCode)}
            {challengeData.initialCode.js !== null && renderEditor("javascript", jsCode, setJsCode)}
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Náhľad</h2>
            <div className="border border-gray-700 p-4 h-[400px] overflow-auto bg-white">
              <iframe
                srcDoc={`
                  <html>
                    <head>
                      <style>${cssCode}</style>
                    </head>
                    <body>
                      ${htmlCode}
                    </body>
                    <script>
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

            <button onClick={runTests} className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-600">
              ▶ Overiť riešenie
            </button>

            <div className="mt-4">
              {testResults.map(({ name, result }) => (
                <div key={name} className={`p-2 mb-2 rounded ${result.score > 0 ? "bg-green-800" : "bg-red-800"}`}>
                  <b>
                    {result.score > 0 ? "✓" : "✗"} {name}
                  </b>
                  <span> - {result.score > 0 ? `ok!` : "zle!"}</span>
                  <br />

                  <span className="text-sm text-gray-300 font-italic">
                    {result.score > 0 && result.details_pass && result.details_pass}
                    {result.score === 0 && result.details_fail && result.details_fail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengePage;
