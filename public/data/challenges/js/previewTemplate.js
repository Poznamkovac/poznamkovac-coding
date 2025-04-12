/**
 * Preview template for JavaScript challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @returns {string} - HTML content to render in the preview iframe with JavaScript execution
 */
function previewTemplate(mainFile, fileSystem) {
  // Get main JS file
  const mainJsFile = Array.from(fileSystem.files.values()).find(
    (file) => file.filename === mainFile
  );

  // Get all JS files and their content
  const jsFiles = Array.from(fileSystem.files.values())
    .filter(file => file.filename.endsWith('.js'))
    .reduce((acc, file) => {
      acc[file.filename] = file.content || '';
      return acc;
    }, {});

  // Escape JS content to prevent HTML parsing issues
  const escapeJS = (js) => {
    return js
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Create a string representation of the JS files object
  const jsFilesStr = Object.entries(jsFiles)
    .map(([filename, content]) => `"${filename}": \`${escapeJS(content || '')}\``)
    .join(',\n');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>JavaScript Execution</title>
    <style>
      body {
        font-family: monospace;
        padding: 1rem;
        margin: 0;
      }
      #console {
        border: 1px solid #ccc;
        background-color: #f5f5f5;
        border-radius: 4px;
        padding: 10px;
        width: 100%;
        min-height: 200px;
        max-height: 100%;
        overflow: auto;
        margin-top: 10px;
        white-space: pre-wrap;
      }
      .console-line {
        margin: 0;
        padding: 2px 0;
      }
      .log { color: #333; }
      .error { color: #f44336; }
      .warn { color: #ff9800; }
      .info { color: #2196f3; }
    </style>
  </head>
  <body>
    <h3>JavaScript Output</h3>
    <div id="console"></div>
    
    <script>
      // Initialize the virtual file system with all JS files
      const files = {
        ${jsFilesStr}
      };
      
      // Set up a virtual console that writes to our console div
      const consoleOutput = document.getElementById('console');
      
      // Create line element for console output
      function createLineElement(text, className) {
        const line = document.createElement('pre');
        line.className = \`console-line \${className}\`;
        line.textContent = text;
        return line;
      }
      
      // Override console methods
      const originalConsole = { ...console };
      const consoleCapture = {
        log: (...args) => {
          const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
          consoleOutput.appendChild(createLineElement(text, 'log'));
          originalConsole.log(...args);
        },
        error: (...args) => {
          const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
          consoleOutput.appendChild(createLineElement(text, 'error'));
          originalConsole.error(...args);
        },
        warn: (...args) => {
          const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
          consoleOutput.appendChild(createLineElement(text, 'warn'));
          originalConsole.warn(...args);
        },
        info: (...args) => {
          const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
          consoleOutput.appendChild(createLineElement(text, 'info'));
          originalConsole.info(...args);
        }
      };
      
      // Replace console methods
      console.log = consoleCapture.log;
      console.error = consoleCapture.error;
      console.warn = consoleCapture.warn;
      console.info = consoleCapture.info;

      // Execute all JavaScript files in the correct order
      // We wrap execution in a try-catch to handle any runtime errors
      try {
        // Execute the main file first
        const mainContent = files["${mainFile}"];
        if (mainContent) {
          // Create a function to execute the code to avoid global variable issues
          const executeCode = new Function('files', \`
            try {
              \${mainContent}
            } catch (error) {
              console.error('Runtime error:', error.message);
            }
          \`);
          
          // Execute the code with access to the files
          executeCode(files);
        } else {
          console.error('Main file not found');
        }
      } catch (error) {
        console.error('Execution error:', error.message);
      }
    </script>
  </body>
</html>
`;
}

// Export using CommonJS style
exports.default = previewTemplate; 