/**
 * Preview template for Python challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @returns {string} - HTML content to render in the preview iframe with Python execution via Pyodide
 */
function previewTemplate(mainFile, fileSystem) {
  // Get all files and their content
  const allFiles = Array.from(fileSystem.files.values()).reduce((acc, file) => {
    acc[file.filename] = file.content || "";
    return acc;
  }, {});

  // Check if autoreload is disabled for the main file
  const mainFileObject = Array.from(fileSystem.files.values()).find(file => file.filename === mainFile);
  const autoReloadDisabled = mainFileObject?.autoreload === false;

  // Escape content to prevent HTML parsing issues
  const escapeContent = (content) => {
    return content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\${/g, "\\${");
  };

  // Create a string representation of the files object
  const filesStr = Object.entries(allFiles)
    .map(([filename, content]) => `"${filename}": \`${escapeContent(content || "")}\``)
    .join(",\n");

  // Get Python files for import path setup
  const pyFiles = Object.keys(allFiles).filter((file) => file.endsWith(".py"));

  // Normalize the main file path for Python
  const normalizedMainFile = mainFile.replace(/\\/g, "/");

  // Pre-process file directories to avoid scope issues
  const pythonFilePaths = pyFiles.map((filename) => {
    const normalizedPath = filename.replace(/\\/g, "/");
    const dirParts = normalizedPath.split("/");
    const dir = dirParts.length > 1 ? dirParts.slice(0, -1).join("/") : "";

    return {
      filename: normalizedPath,
      directory: dir,
    };
  });

  // Generate the import paths setup code
  const importPathsSetup = pythonFilePaths
    .filter((file) => file.filename !== normalizedMainFile && file.directory)
    .map((file) => {
      return `
        if ("${file.directory}" && !sys.path.includes("${file.directory}")) {
          sys.path.insert(0, "${file.directory}")
        }
      `;
    })
    .join("\n");

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Python</title>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      body {
        font-family: monospace;
        background-color: #000;
        color: #f0f0f0;
        display: flex;
        flex-direction: column;
      }
      #loader {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin: 20px;
        height: 100%;
      }
      #console {
        width: 100%;
        height: 100%;
        overflow: auto;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }
      #stdout, #stderr {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
      }
      #stderr {
        color: #ff5555;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-left-color: #0f0;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      #manual-run {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        padding: 20px;
      }
      #run-button {
        margin-top: 15px;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      #run-button:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div id="loader">
      <div class="spinner"></div>
      <p>⌛️...</p>
    </div>
    <div id="manual-run">
      <h3>Python kód je pripravený na spustenie</h3>
      <p>Automatické spúšťanie je vypnuté pre tento súbor.</p>
      <button id="run-button">▶️ Spustiť kód</button>
    </div>
    <div id="console">
      <div id="stdout"></div>
      <div id="stderr"></div>
    </div>
    
    <script>
      // Initialize the virtual file system with all files
      const files = {
        ${filesStr}
      };
      
      // The normalized main file path - defined before evaluation
      const mainFilePath = "${normalizedMainFile}";
      
      // Set up outputs for stdout and stderr
      const stdout = document.getElementById('stdout');
      const stderr = document.getElementById('stderr');
      const loader = document.getElementById('loader');
      const manualRun = document.getElementById('manual-run');
      const runButton = document.getElementById('run-button');
      const consoleOutput = document.getElementById('console');
      
      // Check if autoreload is disabled
      const autoReloadDisabled = ${autoReloadDisabled};
      
      // Function to add output to the console
      function addOutput(text, stream) {
        const outputElement = document.getElementById(stream);
        const line = document.createElement('span');
        line.textContent = text;
        outputElement.appendChild(line);
      }
      
      // Flag to indicate when Pyodide is ready
      window.pyodideReady = false;
      
      // Main function to initialize Pyodide and run Python code
      async function main(shouldRunCode = true) {
        try {
          // Initialize Pyodide
          window.pyodide = await loadPyodide();
          
          // Hide loader once Pyodide is loaded
          loader.style.display = 'none';
          
          // If autoreload is disabled, show manual run button
          if (autoReloadDisabled && !shouldRunCode) {
            manualRun.style.display = 'flex';
            consoleOutput.style.display = 'none';
            window.pyodideReady = true;
            notifyReady();
            return;
          } else {
            manualRun.style.display = 'none';
            consoleOutput.style.display = 'flex';
          }
          
          // Set up stdout/stderr capture
          window.pyodide.runPython(\`
            import sys
            import io
            
            class CaptureIO(io.StringIO):
                def __init__(self, stream_name):
                    super().__init__()
                    self.stream_name = stream_name
                
                def write(self, text):
                    super().write(text)
                    # Send output to JS with stream information
                    from js import addOutput
                    addOutput(text, self.stream_name)
            
            sys.stdout = CaptureIO('stdout')
            sys.stderr = CaptureIO('stderr')
            
            # Set up import paths for modules
            import sys
            ${importPathsSetup}
          \`);
          
          // Create a Python virtual filesystem and load all files
          for (const [filename, content] of Object.entries(files)) {
            // Create file in Pyodide filesystem
            const pyodideFilename = filename.replace(/\\\\/g, '/');
            window.pyodide.FS.writeFile(pyodideFilename, content);
          }
          
          // Execute the main Python file
          if (files[mainFilePath]) {
            try {
              // Run the main script
              window.pyodide.runPython(files[mainFilePath]);
            } catch (error) {
              // Handle Python execution errors
              addOutput(\`\${error.message}\`, 'stderr');
              console.error(error);
            }
          } else {
            addOutput(\`Chyba: hlavný súbor "\${mainFilePath}" sa nenašiel\`, 'stderr');
          }
        } catch (error) {
          // Handle Pyodide loading errors
          loader.style.display = 'none';
          addOutput(\`Nepodarilo sa inicializovať Python prostredie: \${error.message}\`, 'stderr');
          console.error('Chyba inicializácie Pyodide:', error);
        } finally {
          // Notify that we're ready for tests
          window.pyodideReady = true;
          notifyReady();
        }
      }
      
      // Start the main function with or without code execution based on autoreload setting
      main(!autoReloadDisabled);
      
      // Set up manual run button event listener
      runButton.addEventListener('click', function() {
        manualRun.style.display = 'none';
        consoleOutput.style.display = 'flex';
        main(true);
      });
      
      // Function to notify parent that the iframe is ready for testing
      function notifyReady() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'python' }, '*');
        }
      }
      
      // Also notify on DOM content loaded (safety measure)
      document.addEventListener('DOMContentLoaded', function() {
        // Mark a setTimeout to check for readiness periodically
        let readyCheckCount = 0;
        const checkPyodideReady = setInterval(() => {
          readyCheckCount++;
          if (window.pyodideReady) {
            notifyReady();
            clearInterval(checkPyodideReady);
          } else if (readyCheckCount > 10) {
            // After ~5 seconds, give up and notify anyway
            window.pyodideReady = true; // Force ready state
            notifyReady();
            clearInterval(checkPyodideReady);
          }
        }, 500);
      });
      
      // Absolute fallback - in case all else fails, ensure we notify after 10 seconds
      setTimeout(() => {
        if (!window.pyodideReady) {
          console.warn('Forcing ready state after timeout');
          window.pyodideReady = true;
          notifyReady();
        }
      }, 10000);
    </script>
  </body>
</html>
`;
}

exports.default = previewTemplate;
