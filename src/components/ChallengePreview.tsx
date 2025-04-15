import type React from "react";
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { VirtualFileSystem } from "../types/challenge";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";
import { useI18n } from "../hooks/useI18n";

interface ChallengePreviewProps {
  fileSystem: VirtualFileSystem;
  mainFile: string;
  previewTemplatePath?: string;
  autoReload?: boolean;
  hidden: boolean;
  onIframeLoad?: (api: { forceReload: () => Promise<void> }) => void;
}

const getPlaceholderHTML = (t: (key: string) => string) => {
  const title = t("preview.runYourCode");
  const languageSpecificMessage = `
  <p>${t("preview.autoReloadDisabled")}</p>
`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${t("preview.title")}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 0 2rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: black;
      color: lightgray;
    }
    .message {
      text-align: center;
      max-width: 500px;
      line-height: 1.5;
    }
    .reload-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #666;
    }
    .tech-note {
      font-size: 0.8rem;
      opacity: 0.7;
      margin-top: 1rem;
    }
    .tech-note a {
      color: gainsboro;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 1rem;
    }
    .button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      font-weight: 500;
      cursor: pointer;
    }
    .button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="message">
    <div class="reload-icon">🔄</div>
    <h3>${title}</h3>
    ${languageSpecificMessage}
  </div>
</body>
</html>
  `;
};

const ChallengePreview: React.FC<ChallengePreviewProps> = ({
  fileSystem,
  mainFile,
  previewTemplatePath,
  autoReload = true,
  hidden = false,
  onIframeLoad,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [needsManualReload, setNeedsManualReload] = useState(false);
  const [shouldRefreshPreview, setShouldRefreshPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileSystemRef = useRef(fileSystem);
  const autoReloadRef = useRef(autoReload);
  const previewTemplateRef = useRef<((mainFile: string, fileSystem: VirtualFileSystem) => string) | null>(null);
  const { t } = useI18n();

  // Track file changes to force full reloads when needed
  const fileContentRef = useRef<Record<string, string>>({});

  // Process the HTML to resolve file references
  const processHTML = useCallback((html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const fs = fileSystemRef.current;

    // Process CSS link tags
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach((linkTag) => {
      const href = linkTag.getAttribute("href");
      if (href) {
        // Find the CSS file in our virtual filesystem
        const cssFile = Array.from(fs.files.values()).find((file) => file.filename === href);

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
        const jsFile = Array.from(fs.files.values()).find((file) => file.filename === src);

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
  }, []);

  // Update iframe content
  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    const fs = fileSystemRef.current;
    if (!iframe || !iframe.contentDocument) return;

    // Store current file contents for change detection
    const currentFileContents: Record<string, string> = {};
    fs.getAllFiles().forEach((file) => {
      if (file.content) {
        currentFileContents[file.filename] = file.content;
      }
    });

    // Check if any file has changed significantly
    const hasSignificantChanges = Object.entries(currentFileContents).some(([filename, content]) => {
      return fileContentRef.current[filename] !== content;
    });

    // Update content references for future change detection
    fileContentRef.current = { ...currentFileContents };

    // Force a complete reload if there are significant changes
    if (shouldRefreshPreview || hasSignificantChanges) {
      // Re-process the HTML with the latest file content
      if (previewTemplateRef.current) {
        // Use the custom preview template if available
        const generatedHTML = previewTemplateRef.current(mainFile, fs);
        iframe.srcdoc = generatedHTML;
      } else {
        const htmlFile = Array.from(fs.files.values()).find(
          (file) => file.filename === mainFile || file.filename.toLowerCase() === "index.html"
        );

        if (htmlFile?.content) {
          const processedHTML = processHTML(htmlFile.content);
          iframe.srcdoc = processedHTML;
        }
      }

      setShouldRefreshPreview(false);
      return;
    }

    // Otherwise, just update the script and style contents (for HTML previews only)
    if (!previewTemplateRef.current) {
      const iframeDoc = iframe.contentDocument;

      // Process inline and external scripts
      const scriptTags = Array.from(iframeDoc.querySelectorAll("script[src], script[data-source-file]"));
      scriptTags.forEach((scriptTag) => {
        const sourceFile = scriptTag.getAttribute("data-source-file") || scriptTag.getAttribute("src");
        if (sourceFile) {
          const jsFile = Array.from(fs.files.values()).find((file) => file.filename === sourceFile);
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
          const cssFile = Array.from(fs.files.values()).find((file) => file.filename === sourceFile);
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
    }
  }, [mainFile, shouldRefreshPreview, processHTML]);

  // Force reload the preview
  const reloadPreview = () => {
    setShouldRefreshPreview(true);
    setIsLoading(true);
    requestAnimationFrame(() => {
      updateIframeContent();
      setNeedsManualReload(false);
    });
  };

  // Public method to force reload the preview (used by tests)
  const forceReload = useCallback(() => {
    return new Promise<void>((resolve) => {
      // Set up a load handler to resolve the promise
      const iframe = iframeRef.current;
      if (!iframe) {
        resolve();
        return;
      }

      // Notify parent that preview is reloading and not ready
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "PREVIEW_RELOADING" },
          origin: window.location.origin,
        })
      );

      const handleLoad = () => {
        iframe.removeEventListener("load", handleLoad);
        resolve();
      };

      // Add event listener for load
      iframe.addEventListener("load", handleLoad);

      // Force immediate reload by directly updating content
      setIsLoading(true);

      // Get the latest content
      const fs = fileSystemRef.current;

      // Tests should always show the result, not the placeholder
      if (previewTemplateRef.current) {
        // Use the custom preview template if available
        const generatedHTML = previewTemplateRef.current(mainFile, fs);
        iframe.srcdoc = generatedHTML;
      } else {
        const htmlFile = Array.from(fs.files.values()).find(
          (file) => file.filename === mainFile || file.filename.toLowerCase() === "index.html"
        );

        if (htmlFile?.content) {
          const processedHTML = processHTML(htmlFile.content);
          iframe.srcdoc = processedHTML;
        }
      }

      setNeedsManualReload(false);
      setShouldRefreshPreview(false);

      // Update content references for future change detection
      const currentFileContents: Record<string, string> = {};
      fs.getAllFiles().forEach((file) => {
        if (file.content) {
          currentFileContents[file.filename] = file.content;
        }
      });
      fileContentRef.current = { ...currentFileContents };

      // Fallback - resolve after 5 seconds if load event doesn't fire
      setTimeout(() => {
        iframe.removeEventListener("load", handleLoad);
        resolve();
      }, 5000);
    });
  }, [mainFile, processHTML]);

  // Update fileSystemRef when fileSystem changes
  useEffect(() => {
    fileSystemRef.current = fileSystem;
  }, [fileSystem]);

  // Update autoReloadRef when autoReload changes
  useEffect(() => {
    autoReloadRef.current = autoReload;
  }, [autoReload]);

  // Load custom preview template if specified
  useEffect(() => {
    const loadPreviewTemplate = async () => {
      if (previewTemplatePath) {
        try {
          const response = await fetch(previewTemplatePath);
          const templateCode = await response.text();

          // Create a wrapper function that can execute the code safely
          // This approach avoids issues with parsing the function and ensures returns work correctly
          const wrappedCode = `
            const module = {}; 
            (function(exports) { 
              ${templateCode} 
            })(module);
            return module.default || null;
          `;

          try {
            // Execute the wrapped code to get the exported function
            const templateFunction = new Function(wrappedCode)();

            if (typeof templateFunction === "function") {
              // Use type assertion to ensure TypeScript understands the type
              previewTemplateRef.current = templateFunction as (mainFile: string, fileSystem: VirtualFileSystem) => string;
            } else {
              console.error(t("preview.templateNotFunction"));
              previewTemplateRef.current = null;
            }
          } catch (evalError) {
            console.error(t("preview.errorEvaluatingTemplate"), evalError);
            previewTemplateRef.current = null;
          }
        } catch (error) {
          console.error(t("preview.failedToLoadTemplate"), error);
          previewTemplateRef.current = null;
        }
      } else {
        previewTemplateRef.current = null;
      }
    };

    loadPreviewTemplate();
  }, [previewTemplatePath, t]);

  // Initialize the iframe with HTML content
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);

    // Check if the main file or the current file type has autoreload disabled
    const mainFileData = Array.from(fileSystem.files.values()).find((file) => file.filename === mainFile);
    const fileAutoreload = mainFileData?.autoreload;

    // If explicitly set to false in the file, or global autoReload is false
    if (fileAutoreload === false || !autoReload) {
      // If autoreload is disabled, show a placeholder initially
      iframe.srcdoc = getPlaceholderHTML(t);

      // Initial file content snapshot still needed for change detection
      const initialFiles = fileSystem.getAllFiles();
      initialFiles.forEach((file) => {
        if (file.content) {
          fileContentRef.current[file.filename] = file.content;
        }
      });
      return;
    }

    if (previewTemplateRef.current) {
      // Use the custom preview template if available
      const generatedHTML = previewTemplateRef.current(mainFile, fileSystem);
      iframe.srcdoc = generatedHTML;
    } else {
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
  <title>${t("preview.title")}</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>`;

      // Set initial HTML
      iframe.srcdoc = processHTML(htmlContent);
    }

    // Initial file content snapshot
    const initialFiles = fileSystem.getAllFiles();
    initialFiles.forEach((file) => {
      if (file.content) {
        fileContentRef.current[file.filename] = file.content;
      }
    });
  }, [mainFile, fileSystem, processHTML, autoReload, t]);

  // Handle iframe load event and expose API
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      if (onIframeLoad) {
        onIframeLoad({ forceReload });
      }
    };

    // Add handler for preview ready messages
    const handlePreviewMessages = (event: MessageEvent) => {
      // Forward messages from iframe to parent window
      if (event.source === iframe.contentWindow && event.data && event.data.type === "PREVIEW_READY") {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: event.data,
            origin: window.location.origin,
          })
        );
      }
    };

    iframe.addEventListener("load", handleLoad);
    window.addEventListener("message", handlePreviewMessages);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      window.removeEventListener("message", handlePreviewMessages);
    };
  }, [onIframeLoad, forceReload]);

  // Listen for file changes
  useEffect(() => {
    // Handle file change events
    const handleFileChange = (event: Event) => {
      const { filename, shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

      // Get file-specific autoreload setting if available
      const fileData = Array.from(fileSystemRef.current.files.values()).find((file) => file.filename === filename);

      // Use the file-specific setting if present, fall back to the global setting
      const fileAutoReload = fileData?.autoreload !== undefined ? fileData.autoreload : autoReloadRef.current;

      // Use the ref instead of capturing in closure
      const shouldAutoReload = shouldReload && fileAutoReload;

      if (shouldAutoReload) {
        // HTML changes need a full refresh
        if (filename === mainFile || filename.toLowerCase().endsWith(".html")) {
          setShouldRefreshPreview(true);
        }

        // Schedule update for next frame to avoid React render conflicts
        requestAnimationFrame(() => {
          updateIframeContent();
        });

        setNeedsManualReload(false);
      } else {
        // If the file shouldn't auto-reload, show indication that manual reload is needed
        setNeedsManualReload(true);
      }
    };

    // Add event listener for file changes
    window.addEventListener(FILE_CHANGE_EVENT, handleFileChange);

    return () => {
      window.removeEventListener(FILE_CHANGE_EVENT, handleFileChange);
    };
  }, [mainFile, updateIframeContent]);

  return (
    <div className={`flex flex-col flex-1 mb-4 ${hidden ? "hidden" : ""}`}>
      <div className="flex items-center mb-1">
        <h2 className="flex-grow text-xl font-semibold">{t("preview.title")}</h2>
        {isLoading && <span className="mr-2 text-sm text-gray-500">{t("common.loading")}</span>}
        {needsManualReload && (
          <button
            onClick={reloadPreview}
            className="px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 preview-reload-button"
          >
            🔄 {t("preview.reload")}
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-white border border-gray-700">
        <iframe ref={iframeRef} id="preview" title="preview" className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChallengePreview;
