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
  </head>
  <body>
    <pre class="mermaid" style="color: white;">${allFiles[mainFile]}</pre>
    <script>
      mermaid.initialize({
        startOnLoad: true
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PREVIEW_READY', language: 'uml' }, '*');
      }
    </script>
  </body>
</html>
`;
}

exports.default = previewTemplate;
