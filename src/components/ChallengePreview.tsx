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
  const [shouldRefreshPreview, setShouldRefreshPreview] = useState(false);

  // Track file changes to force full reloads when needed
  const fileContentRef = useRef<Record<string, string>>({});

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
            styleTag.setAttribute("data-source-file", href);
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
            newScriptTag.setAttribute("data-source-file", src);
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

      // Store current file contents for change detection
      const currentFileContents: Record<string, string> = {};
      fileSystem.getAllFiles().forEach((file) => {
        if (file.content) {
          currentFileContents[file.filename] = file.content;
        }
      });

      // Check if any file has changed significantly
      const hasSignificantChanges = Object.entries(currentFileContents).some(([filename, content]) => {
        return fileContentRef.current[filename] !== content;
      });

      // Update content references for future change detection
      fileContentRef.current = currentFileContents;

      // Force a complete reload if there are significant changes
      if (shouldRefreshPreview || hasSignificantChanges) {
        // Re-process the HTML with the latest file content
        const htmlFile = Array.from(fileSystem.files.values()).find(
          (file) => file.filename === mainFile || file.filename.toLowerCase() === "index.html"
        );

        if (htmlFile?.content) {
          const processedHTML = processHTML(htmlFile.content);
          iframe.srcdoc = processedHTML;
          setShouldRefreshPreview(false);
          return;
        }
      }

      // Otherwise, just update the script and style contents

      // Process inline and external scripts
      const scriptTags = Array.from(iframeDoc.querySelectorAll("script[src], script[data-source-file]"));
      scriptTags.forEach((scriptTag) => {
        const sourceFile = scriptTag.getAttribute("data-source-file") || scriptTag.getAttribute("src");
        if (sourceFile) {
          const jsFile = Array.from(fileSystem.files.values()).find((file) => file.filename === sourceFile);
          if (jsFile?.content) {
            // Replace the script with a new one (for proper execution)
            const newScript = iframeDoc.createElement("script");
            newScript.textContent = jsFile.content;
            newScript.setAttribute("data-source-file", sourceFile);
            scriptTag.parentNode?.replaceChild(newScript, scriptTag);
          }
        }
      });

      // Process inline and external styles
      const styleTags = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"], style[data-source-file]'));
      styleTags.forEach((styleTag) => {
        const sourceFile = styleTag.getAttribute("data-source-file") || styleTag.getAttribute("href");
        if (sourceFile) {
          const cssFile = Array.from(fileSystem.files.values()).find((file) => file.filename === sourceFile);
          if (cssFile?.content) {
            // Update style content or replace link with style
            if (styleTag.tagName.toLowerCase() === "style") {
              // Just update content for style tags
              styleTag.textContent = cssFile.content;
            } else {
              // Replace link with style
              const newStyle = iframeDoc.createElement("style");
              newStyle.textContent = cssFile.content;
              newStyle.setAttribute("data-source-file", sourceFile);
              styleTag.parentNode?.replaceChild(newStyle, styleTag);
            }
          }
        }
      });

      // Find all CSS files that aren't explicitly included
      const cssFiles = Array.from(fileSystem.files.values()).filter(
        (file) =>
          file.filename.endsWith(".css") &&
          !file.filename.includes("/") && // Only top-level files
          !Array.from(iframeDoc.querySelectorAll("style[data-source-file]")).some(
            (style) => style.getAttribute("data-source-file") === file.filename
          )
      );

      // Inject any remaining CSS files
      for (const cssFile of cssFiles) {
        if (cssFile.content) {
          let styleElement = iframeDoc.getElementById(`injected-${cssFile.filename}`);
          if (!styleElement) {
            styleElement = iframeDoc.createElement("style");
            styleElement.id = `injected-${cssFile.filename}`;
            styleElement.setAttribute("data-source-file", cssFile.filename);
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
          !Array.from(iframeDoc.querySelectorAll("script[data-source-file]")).some(
            (script) => script.getAttribute("data-source-file") === file.filename
          )
      );

      // Inject any remaining JS files
      for (const jsFile of jsFiles) {
        if (jsFile.content) {
          // Always create a new script element to ensure execution
          const scriptElement = iframeDoc.createElement("script");
          scriptElement.id = `injected-${jsFile.filename}`;
          scriptElement.setAttribute("data-source-file", jsFile.filename);

          scriptElement.textContent = `
            try {
              ${jsFile.content}
            } catch (error) {
              document.body.innerHTML = '<pre id="chyba" style="color: red;">' + error.toString() + '</pre>' + document.body.innerHTML;
            }
          `;

          // Remove any existing script with the same ID
          const existingScript = iframeDoc.getElementById(`injected-${jsFile.filename}`);
          if (existingScript) {
            existingScript.remove();
          }

          iframeDoc.body.appendChild(scriptElement);
        }
      }
    };

    // Handle file change events
    const handleFileChange = (event: Event) => {
      const { filename, shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

      if (shouldReload) {
        // HTML changes need a full refresh
        if (filename === mainFile || filename.toLowerCase().endsWith(".html")) {
          setShouldRefreshPreview(true);
        }

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
    iframe.srcdoc = processHTML(htmlContent);
    iframe.onload = updateIframeContent;

    // Listen for file changes
    window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);

    // Initial file content snapshot
    fileSystem.getAllFiles().forEach((file) => {
      if (file.content) {
        fileContentRef.current[file.filename] = file.content;
      }
    });

    // Currently works without this:
    // Update preview when file system changes (manual interval as fallback)
    /*const updateInterval = setInterval(() => {
      if (iframe.contentDocument) {
        updateIframeContent();
      }
    }, 2000);*/

    return () => {
      //clearInterval(updateInterval);
      window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
    };
  }, [fileSystem, mainFile, previewType]);

  // Force reload the preview
  const reloadPreview = () => {
    setShouldRefreshPreview(true);
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument) {
      // Force a full reload
      iframe.contentDocument.location.reload();
      setNeedsManualReload(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 mb-4">
      <div className="flex items-center mb-1">
        <h2 className="flex-grow text-xl font-semibold">Preview</h2>
        {needsManualReload && (
          <button onClick={reloadPreview} className="px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
            🔄 Reload
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 p-4 overflow-auto bg-white border border-gray-700">
        <iframe ref={iframeRef} id="preview" title="preview" className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChallengePreview;
