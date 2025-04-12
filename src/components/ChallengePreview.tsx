import type React from "react";
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { VirtualFileSystem } from "../types/challenge";
import { FILE_CHANGE_EVENT, FileChangeEvent } from "../services/virtualFileSystemService";

interface ChallengePreviewProps {
  fileSystem: VirtualFileSystem;
  mainFile: string;
  previewType: string;
  previewTemplatePath?: string;
  autoReload?: boolean;
  hidden: boolean;
  onIframeLoad?: () => void;
}

const ChallengePreview: React.FC<ChallengePreviewProps> = ({
  fileSystem,
  mainFile,
  previewType,
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

  // Track file changes to force full reloads when needed
  const fileContentRef = useRef<Record<string, string>>({});

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
              console.error("Template did not return a function");
              previewTemplateRef.current = null;
            }
          } catch (evalError) {
            console.error("Error evaluating template:", evalError);
            previewTemplateRef.current = null;
          }
        } catch (error) {
          console.error("Failed to load preview template:", error);
          previewTemplateRef.current = null;
        }
      } else {
        previewTemplateRef.current = null;
      }
    };

    loadPreviewTemplate();
  }, [previewTemplatePath]);

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

  // Initialize the iframe with HTML content
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);

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
  <title>Preview</title>
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
  }, [mainFile, fileSystem, processHTML]);

  // Handle iframe load event
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      if (onIframeLoad) {
        onIframeLoad();
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [onIframeLoad]);

  // Listen for file changes
  useEffect(() => {
    // Handle file change events
    const handleFileChange = (event: Event) => {
      const { filename, shouldReload } = (event as CustomEvent<FileChangeEvent>).detail;

      // Use the ref instead of capturing in closure
      const shouldAutoReload = shouldReload && autoReloadRef.current;

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

  // Force reload the preview
  const reloadPreview = () => {
    setShouldRefreshPreview(true);
    setIsLoading(true);
    requestAnimationFrame(() => {
      updateIframeContent();
      setNeedsManualReload(false);
    });
  };

  return (
    <div className={`flex flex-col flex-1 mb-4 ${hidden ? "hidden" : ""}`}>
      <div className="flex items-center mb-1">
        <h2 className="flex-grow text-xl font-semibold">Preview</h2>
        {isLoading && <span className="mr-2 text-sm text-gray-500">Loading...</span>}
        {needsManualReload && (
          <button onClick={reloadPreview} className="px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
            🔄 Reload
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
