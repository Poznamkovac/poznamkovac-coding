/**
 * Preview template for JavaScript challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @returns {string} - HTML content to render in the preview iframe with JavaScript execution
 */
function previewTemplate(mainFile, fileSystem) {
  // Determine what file to use as the main entry point
  let mainJsFile = mainFile;
  let mainHtmlFile = "index.html";

  // If the mainFile is not a JS file, try to find index.html or use the specified mainFile
  if (!mainFile.endsWith(".js")) {
    mainHtmlFile = mainFile;
    // Try to find a main JS file
    const jsFiles = Array.from(fileSystem.files.values())
      .filter(file => file.filename.endsWith('.js'))
      .map(file => file.filename);

    if (jsFiles.length > 0) {
      // Prioritize "script.js" or "main.js" if they exist
      if (jsFiles.includes("script.js")) {
        mainJsFile = "script.js";
      } else if (jsFiles.includes("main.js")) {
        mainJsFile = "main.js";
      } else {
        // Otherwise use the first JS file
        mainJsFile = jsFiles[0];
      }
    }
  }

  // Get all files and their content
  const allFiles = Array.from(fileSystem.files.values()).reduce((acc, file) => {
    acc[file.filename] = file.content || '';
    return acc;
  }, {});

  // Escape content to prevent HTML parsing issues
  const escapeContent = (content) => {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Create a string representation of the JS files object
  const filesStr = Object.entries(allFiles)
    .map(([filename, content]) => `"${filename}": \`${escapeContent(content || '')}\``)
    .join(',\n');

  // Check if we have an HTML file to use
  const htmlFile = fileSystem.files.get(mainHtmlFile);

  // If we have an HTML file, use it as the base, otherwise generate a basic HTML page
  if (htmlFile && htmlFile.content) {
    // Process HTML to inline JS and CSS
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFile.content, "text/html");

    // Process CSS link tags
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach((linkTag) => {
      const href = linkTag.getAttribute("href");
      if (href) {
        // Find the CSS file in our virtual filesystem
        const cssFile = fileSystem.files.get(href);
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
        const jsFile = fileSystem.files.get(src);
        if (jsFile?.content) {
          // Replace with inline script
          const newScriptTag = doc.createElement("script");
          newScriptTag.textContent = jsFile.content;
          newScriptTag.setAttribute("data-source-file", src);
          scriptTag.replaceWith(newScriptTag);
        }
      }
    });

    // Add console capture script to the head
    const head = doc.querySelector('head');
    if (head) {
      const consoleScript = doc.createElement('script');
      consoleScript.textContent = `
        // Override console methods to capture output
        (function() {
          const originalConsole = {...console};
          const consoleOutput = document.createElement('div');
          consoleOutput.id = 'console-output';
          consoleOutput.style.cssText = 'font-family: monospace; border: 1px solid #ccc; margin-top: 10px; padding: 10px; background: #f5f5f5; max-height: 200px; overflow: auto;';
          
          // Append console output div after DOM is loaded
          document.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(consoleOutput);
          });
          
          function logToConsole(args, className) {
            const line = document.createElement('div');
            line.className = className || '';
            line.style.margin = '2px 0';
            line.textContent = Array.from(args).map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            consoleOutput.appendChild(line);
          }
          
          // Override console methods
          console.log = function() {
            originalConsole.log.apply(console, arguments);
            logToConsole(arguments, 'log');
          };
          
          console.error = function() {
            originalConsole.error.apply(console, arguments);
            logToConsole(arguments, 'error');
            const line = consoleOutput.lastChild;
            if (line) line.style.color = '#f44336';
          };
          
          console.warn = function() {
            originalConsole.warn.apply(console, arguments);
            logToConsole(arguments, 'warn');
            const line = consoleOutput.lastChild;
            if (line) line.style.color = '#ff9800';
          };
          
          console.info = function() {
            originalConsole.info.apply(console, arguments);
            logToConsole(arguments, 'info');
            const line = consoleOutput.lastChild;
            if (line) line.style.color = '#2196f3';
          };
        })();
      `;
      head.appendChild(consoleScript);
    }

    // Return the processed HTML
    return doc.documentElement.outerHTML;
  } else {
    // If no HTML file exists, create a basic console page with JavaScript execution
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>JavaScript Execution</title>
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
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
      // Initialize the virtual file system with all files
      const files = {
        ${filesStr}
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

      // Execute the main JavaScript file
      try {
        const mainContent = files["${mainJsFile}"];
        if (mainContent) {
          console.log("Running ${mainJsFile}...");
          
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
          console.error('Main JavaScript file "${mainJsFile}" not found');
        }
      } catch (error) {
        console.error('Execution error:', error.message);
      }
    </script>
  </body>
</html>
`;
  }
}

// Export using CommonJS style
exports.default = previewTemplate; 