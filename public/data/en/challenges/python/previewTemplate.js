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
    <title>Python Execution</title>
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
    </style>
  </head>
  <body>
    <div id="loader">
      <div class="spinner"></div>
      <p>⌛️...</p>
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
      async function main() {
        try {
          // Initialize Pyodide
          window.pyodide = await loadPyodide();
          
          // Hide loader once Pyodide is loaded
          loader.style.display = 'none';
          
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
            addOutput(\`Error: Main file "\${mainFilePath}" not found\`, 'stderr');
          }
        } catch (error) {
          // Handle Pyodide loading errors
          loader.style.display = 'none';
          addOutput(\`Failed to initialize Python environment: \${error.message}\`, 'stderr');
          console.error('Pyodide initialization error:', error);
        } finally {
          // Notify that we're ready for tests
          notifyReady();
        }
      }
      
      // Start the main function
      main();

      // Function to notify parent that the iframe is ready for testing
      function notifyReady() {
        window.pyodideReady = true;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'python' }, '*');
        }
      }
    </script>
  </body>
</html>
`;
}

// Export using CommonJS style
exports.default = previewTemplate;
