import type React from "react";
import { useEffect, useRef, useState } from "react";
import { VirtualFileSystem } from "../types/challenge";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";

interface ChallengePreviewProps {
  fileSystem: VirtualFileSystem;
  mainFile: string;
  previewType: string;
}

const ChallengePreview: React.FC<ChallengePreviewProps> = ({ fileSystem, mainFile, previewType }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [needsManualReload, setNeedsManualReload] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Get HTML content - try to find the main file first
    const htmlFile =
      Array.from(fileSystem.files.values()).find((file) => file.filename === mainFile) ||
      Array.from(fileSystem.files.values()).find((file) => file.filename.toLowerCase() === "index.html");

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

    // Handle file change events
    const handleFileChange = (event: Event) => {
      const { filename, shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

      if (shouldReload) {
        // If the file should auto-reload, refresh the preview
        if (iframe.contentDocument) {
          updateIframeContent();
        }
        setNeedsManualReload(false);
      } else {
        // If the file shouldn't auto-reload, show indication that manual reload is needed
        setNeedsManualReload(true);
      }
    };

    // Set initial HTML
    iframe.srcdoc = htmlContent;
    iframe.onload = updateIframeContent;

    // Listen for file changes
    window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);

    // Update preview when file system changes (manual interval as fallback)
    const updateInterval = setInterval(() => {
      if (iframe.contentDocument) {
        updateIframeContent();
      }
    }, 2000); // Less frequent updates as we're using events now

    return () => {
      clearInterval(updateInterval);
      window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
    };
  }, [fileSystem, mainFile, previewType]);

  // Force reload the preview
  const reloadPreview = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument) {
      iframe.contentDocument.location.reload();
      setNeedsManualReload(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col mb-4">
      <div className="flex items-center mb-1">
        <h2 className="text-xl font-semibold flex-grow">Preview</h2>
        {needsManualReload && (
          <button onClick={reloadPreview} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            🔄 Reload
          </button>
        )}
      </div>
      <div className="flex-1 border border-gray-700 p-4 bg-white overflow-auto min-h-0">
        <iframe ref={iframeRef} id="preview" title="preview" className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChallengePreview;
