/**
 * Preview template for UML challenges
 * @param {string} mainFile - The main file to render
 * @param {object} fileSystem - The virtual file system
 * @param {function} t - Translation function
 * @returns {string} - HTML content to render in the preview iframe
 */
function previewTemplate(mainFile, fileSystem, t) {
  const allFiles = Array.from(fileSystem.files.values()).reduce((acc, file) => {
    acc[file.filename] = file.content || "";
    return acc;
  }, {});

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${t("preview.title")}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'uml', failure: false }, '*');
        }
        const loadingElem = document.getElementById('loading');
        if (loadingElem) {
          loadingElem.remove();
        }
        
        // Add timeout fallback for Mermaid rendering issues
        setTimeout(function() {
          const diagrams = document.querySelectorAll('.mermaid svg');
          if (diagrams.length === 0) {
            console.warn('${t("preview.loadingTimeout")}');
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'PREVIEW_READY', language: 'uml', failure: true }, '*');
            }
          }
        }, 5000);
      });
    </script>
  </head>
  <body>
    <p id="loading">${t("preview.loading")}</p>
    <pre class="mermaid" style="color: white;">${allFiles[mainFile]}</pre>
    <script>
      mermaid.initialize({
        startOnLoad: true
      });
    </script>
  </body>
</html>
`;
}

exports.default = previewTemplate;
