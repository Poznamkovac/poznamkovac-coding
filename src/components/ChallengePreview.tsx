import type React from "react";
import { useEffect, useRef } from "react";
import { VirtualFileSystem } from "../types/challenge";

interface ChallengePreviewProps {
  fileSystem: VirtualFileSystem;
}

const ChallengePreview: React.FC<ChallengePreviewProps> = ({ fileSystem }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Get HTML content - try to find an index.html file
    const htmlFile = Array.from(fileSystem.files.values()).find((file) => file.filename.toLowerCase() === "index.html");

    // If no HTML file is found, create a basic HTML structure
    const htmlContent =
      htmlFile?.content ||
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Preview</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;

    // Process the HTML to resolve file references
    const processHTML = (html: string): string => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Process CSS link tags
      const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
      linkTags.forEach((linkTag) => {
        const href = linkTag.getAttribute("href");
        if (href) {
          // Find the CSS file in our virtual filesystem
          const cssFile = Array.from(fileSystem.files.values()).find((file) => file.filename === href);

          if (cssFile?.content) {
            // Replace with style tag
            const styleTag = doc.createElement("style");
            styleTag.textContent = cssFile.content;
            linkTag.replaceWith(styleTag);
          }
        }
      });

      // Process script tags
      const scriptTags = doc.querySelectorAll("script[src]");
      scriptTags.forEach((scriptTag) => {
        const src = scriptTag.getAttribute("src");
        if (src) {
          // Find the JS file in our virtual filesystem
          const jsFile = Array.from(fileSystem.files.values()).find((file) => file.filename === src);

          if (jsFile?.content) {
            // Replace with inline script
            const newScriptTag = doc.createElement("script");
            newScriptTag.textContent = jsFile.content;
            scriptTag.replaceWith(newScriptTag);
          }
        }
      });

      return doc.documentElement.outerHTML;
    };

    // Update iframe content
    const updateIframeContent = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      // Process the HTML to resolve includes
      const processedHTML = processHTML(iframe.srcdoc || "");

      // Find all CSS files that aren't explicitly included
      const cssFiles = Array.from(fileSystem.files.values()).filter(
        (file) =>
          file.filename.endsWith(".css") &&
          !file.filename.includes("/") && // Only top-level files
          !processedHTML.includes(file.filename) && // Not already included
          file.filename !== "style.css" // Not the default CSS file
      );

      // Inject any remaining CSS files
      for (const cssFile of cssFiles) {
        if (cssFile.content) {
          let styleElement = iframeDoc.getElementById(`injected-${cssFile.filename}`);
          if (!styleElement) {
            styleElement = iframeDoc.createElement("style");
            styleElement.id = `injected-${cssFile.filename}`;
            iframeDoc.head.appendChild(styleElement);
          }
          styleElement.textContent = cssFile.content;
        }
      }

      // Find all JS files that aren't explicitly included
      const jsFiles = Array.from(fileSystem.files.values()).filter(
        (file) =>
          file.filename.endsWith(".js") &&
          !file.filename.includes("/") && // Only top-level files
          !processedHTML.includes(file.filename) && // Not already included
          file.filename !== "script.js" // Not the default JS file
      );

      // Inject any remaining JS files
      for (const jsFile of jsFiles) {
        if (jsFile.content) {
          let scriptElement = iframeDoc.getElementById(`injected-${jsFile.filename}`);
          if (!scriptElement) {
            scriptElement = iframeDoc.createElement("script");
            scriptElement.id = `injected-${jsFile.filename}`;
            iframeDoc.body.appendChild(scriptElement);
          }

          scriptElement.textContent = `
            try {
              ${jsFile.content}
            } catch (error) {
              document.body.innerHTML = '<pre id="chyba" style="color: red;">' + error.toString() + '</pre>' + document.body.innerHTML;
            }
          `;
        }
      }
    };

    // Set initial HTML
    iframe.srcdoc = htmlContent;
    iframe.onload = updateIframeContent;

    // Update preview when file system changes
    const updateInterval = setInterval(() => {
      if (iframe.contentDocument) {
        updateIframeContent();
      }
    }, 500);

    return () => {
      clearInterval(updateInterval);
    };
  }, [fileSystem]);

  return (
    <div className="flex-1 flex flex-col mb-4">
      <h2 className="mb-1 text-xl font-semibold">Preview</h2>
      <div className="flex-1 border border-gray-700 p-4 bg-white overflow-auto min-h-0">
        <iframe ref={iframeRef} id="preview" title="preview" className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChallengePreview;
