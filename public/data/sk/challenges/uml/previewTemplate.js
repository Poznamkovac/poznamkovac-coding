function previewTemplate(mainFile, fileSystem) {
  const allFiles = Array.from(fileSystem.files.values()).reduce((acc, file) => {
    acc[file.filename] = file.content || "";
    return acc;
  }, {});

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>UML (Mermaid)</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'uml' }, '*');
        }
        const loadingElem = document.getElementById('loading');
        if (loadingElem) {
          loadingElem.remove();
        }
      });
    </script>
  </head>
  <body>
    <p id="loading">Loading...</p>
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
