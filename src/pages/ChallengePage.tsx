import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { ChallengeData } from "../types/challenge";
import { Test } from "../types/test";

type CodeState = [string, boolean] | null;

/**
 * Stránka s detailom úlohy.
 */
const ChallengePage: React.FC = () => {
  const { categoryId, challengeId } = useParams<{
    categoryId: string;
    challengeId: string;
  }>();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [htmlCode, setHtmlCode] = useState<CodeState>(null);
  const [cssCode, setCssCode] = useState<CodeState>(null);
  const [jsCode, setJsCode] = useState<CodeState>(null);
  const [_, setPreviewError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Array<{ name: string; result: Test }>>([]);
  const [imageExists, setImageExists] = useState<boolean>(false);

  useEffect(() => {
    // Načíta dáta o úlohe
    fetch(`/data/ulohy/${categoryId}/${challengeId}/zadanie.json`)
      .then((response) => response.json())
      .then((data: ChallengeData) => {
        setChallengeData(data);
        setHtmlCode(processInitialCode(data.pociatocnyKod.html));
        setCssCode(processInitialCode(data.pociatocnyKod.css));
        setJsCode(processInitialCode(data.pociatocnyKod.js));
      })
      .catch((error) => console.error("Chyba pri načítavaní údajov úlohy:", error));

    // Zobrazí obrázok, ak existuje
    fetch(`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`)
      .then((response) => {
        if (response.headers.get("content-type")?.startsWith("image")) {
          setImageExists(true);
        }
      })
      .catch(() => setImageExists(false));
  }, [categoryId, challengeId]);

  const processInitialCode = (code: string | string[] | null | undefined): CodeState => {
    if (Array.isArray(code)) {
      if (code.length === 0) return null;
      return code.length === 1 ? [code[0], false] : [code[0], !!code[1]];
    }
    if (typeof code === 'string') return [code, false];
    return null;
  };

  /**
   * Spravuje zmeny v kóde editora a náhľad.
   */
  const handleCodeChange = (language: string, value: string) => {
    const updateCode = (prevState: CodeState): CodeState => 
      prevState ? [value, prevState[1]] : [value, false];

    switch (language) {
      case "html":
        setHtmlCode(updateCode);
        break;
      case "css":
        setCssCode(updateCode);
        break;
      case "js":
        setJsCode(updateCode);
        break;
    }
    setPreviewError(null);
  };

  /**
   * Spustí testy pre overenie riešenia úlohy.
   */
  const runTests = async () => {
    try {
      const testModule = await import(/* @vite-ignore */ `/data/ulohy/${categoryId}/${challengeId}/testy.js`);
      const tester = new testModule.default();

      const previewWindow = (document.getElementById("preview") as HTMLIFrameElement)?.contentWindow;

      const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tester)).filter(
        (prop) => prop.startsWith("test_") && typeof tester[prop] === "function"
      );

      const results = await Promise.all(
        testMethods.map(async (method) => {
          try {
            const result: Test = await tester[method](previewWindow);
            return { name: method, result };
          } catch (error) {
            console.error(`Chyba v metóde: ${method}:`, error);
            return {
              name: method,
              result: { detaily_zle: `Chyba pri spúštaní testov: ${error}` },
            };
          }
        })
      );

      setTestResults(results);
    } catch (error: any) {
      console.error("Chyba pri spúštaní testov", error);
      setTestResults([
        {
          name: "Error",
          result: { detaily_zle: "Nastala chyba pri testovaní." },
        },
      ]);
    }
  };

  /**
   * Vykreslí editor pre daný jazyk.
   */
  const renderEditor = (language: string, codeState: CodeState, setCode: React.Dispatch<React.SetStateAction<CodeState>>) => {
    if (!codeState) return null;
    const [code, readOnly] = codeState;

    return (
      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">{language.toUpperCase()}</h2>
        <CodeEditor
          readOnly={readOnly}
          language={language}
          value={code}
          onChange={(value) => {
            if (!readOnly) {
              setCode([value || "", readOnly]);
              handleCodeChange(language, value || "");
            }
          }}
        />
      </div>
    );
  };

  if (!challengeData) return <div>Načítavam...</div>;

  return (
    <div className="min-h-screen text-white">
      <main className="container p-4 mx-auto">
        <h2 className="mb-4 text-3xl font-bold">{challengeData.nazov}</h2>
        <p className="mb-6" dangerouslySetInnerHTML={{ __html: challengeData.zadanie }} />

        {imageExists && (
          <div className="mb-6">
            <img
              src={`/data/ulohy/${categoryId}/${challengeId}/obrazok.png`}
              alt="Obrázok k úlohe"
              className="h-auto max-w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            {renderEditor("html", htmlCode, setHtmlCode)}
            {renderEditor("css", cssCode, setCssCode)}
            {renderEditor("javascript", jsCode, setJsCode)}
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Náhľad</h2>
            <div className="border border-gray-700 p-4 h-[400px] overflow-auto bg-white">
              <iframe
                id="preview"
                srcDoc={`
                  <html>
                    <head>
                      <style id="css">${cssCode?.[0] || ''}</style>
                    </head>
                    <body id="html">
                      ${htmlCode?.[0] || ''}
                    </body>
                    <script id="js">
                      try {
                        ${jsCode?.[0] || ''}
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

            <button onClick={runTests} className="px-4 py-2 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
              ▶ Overiť riešenie
            </button>

            <div className="mt-4">
              {testResults.map(({ name, result }) => (
                <div key={name} className={`p-2 mb-2 rounded ${result.detaily_ok ? "bg-green-800" : "bg-red-800"}`}>
                  <b>
                    {result.detaily_ok ? "✓" : "✗"} {name}
                  </b>
                  {result.detaily_ok ? ` - ok!` : ` - zle!`}
                  <br />

                  <span className="text-sm text-gray-300 font-italic">
                    <span dangerouslySetInnerHTML={{ __html: result.detaily_ok || "" }} />
                    <span dangerouslySetInnerHTML={{ __html: result.detaily_zle || "" }} />
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
