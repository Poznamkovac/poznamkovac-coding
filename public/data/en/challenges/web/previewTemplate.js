/**
 * Preview template for HTML challenges
 * @param {string} mainFile - The main file to render
 * @param {object} fileSystem - The virtual file system
 * @returns {string} - HTML content to render in the preview iframe
 */
function previewTemplate(mainFile, fileSystem) {
  // Get the main HTML file content
  const htmlFile = Array.from(fileSystem.files.values()).find(
    (file) => file.filename === mainFile || file.filename.toLowerCase() === "index.html",
  );

  // If no HTML file is found, create a basic HTML structure
  const htmlContent =
    htmlFile?.content ||
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HTML Preview</title>
</head>
<body>
  <div id="app">No HTML content found</div>
</body>
</html>`;

  // Process the HTML to resolve file references
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

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

  // Add script to notify parent when ready
  const notifyScript = doc.createElement("script");
  notifyScript.textContent = `
      document.addEventListener('DOMContentLoaded', function() {
        // Signal to parent window that the preview is ready for testing
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'html' }, '*');
        }
      });
    `;
  doc.head.appendChild(notifyScript);

  return doc.documentElement.outerHTML;
}

exports.default = previewTemplate;
