/**
 * Preview template for Python challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @returns {string} - HTML content to render in the preview iframe with Python execution via Pyodide
 */
function previewTemplate(mainFile, fileSystem) {
  // Get main Python file
  const mainPyFile = Array.from(fileSystem.files.values()).find(
    (file) => file.filename === mainFile
  );

  // Get all Python files and their content
  const pyFiles = Array.from(fileSystem.files.values())
    .filter(file => file.filename.endsWith('.py'))
    .reduce((acc, file) => {
      acc[file.filename] = file.content || '';
      return acc;
    }, {});

  // Escape Python content to prevent HTML parsing issues
  const escapePy = (py) => {
    return py
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\${/g, "\\${");
  };

  // Create a string representation of the Python files object
  const pyFilesStr = Object.entries(pyFiles)
    .map(([filename, content]) => `"${filename}": \`${escapePy(content || '')}\``)
    .join(',\n');

  // Normalize the main file path for Python
  const normalizedMainFile = mainFile.replace(/\\/g, '/');

  // Pre-process file directories to avoid scope issues
  const pythonFilePaths = Object.keys(pyFiles).map(filename => {
    const normalizedPath = filename.replace(/\\/g, '/');
    const dirParts = normalizedPath.split('/');
    const dir = dirParts.length > 1 ? dirParts.slice(0, -1).join('/') : '';

    return {
      filename: normalizedPath,
      directory: dir
    };
  });

  // Generate the import paths setup code
  const importPathsSetup = pythonFilePaths
    .filter(file => file.filename !== normalizedMainFile && file.directory)
    .map(file => {
      return `
        if ("${file.directory}" && !sys.path.includes("${file.directory}")) {
          sys.path.insert(0, "${file.directory}")
        }
      `;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Python Execution</title>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
    <style>
      body {
        font-family: monospace;
        padding: 1rem;
        margin: 0;
      }
      #loader {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin-bottom: 20px;
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
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #155e75;
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
    <h3>Python Output</h3>
    <div id="loader">
      <div class="spinner"></div>
      <p>Loading Pyodide...</p>
    </div>
    <div id="console"></div>
    
    <script>
      // Initialize the virtual file system with all Python files
      const files = {
        ${pyFilesStr}
      };
      
      // The normalized main file path - defined before evaluation
      const mainFilePath = "${normalizedMainFile}";
      
      // Set up a virtual console that writes to our console div
      const consoleOutput = document.getElementById('console');
      const loader = document.getElementById('loader');
      
      // Function to add output to the console
      function addOutput(text, isError = false) {
        const line = document.createElement('div');
        line.textContent = text;
        line.style.color = isError ? '#f44336' : '#333';
        line.style.margin = '2px 0';
        consoleOutput.appendChild(line);
      }
      
      // Flag to indicate when Pyodide is ready
      window.pyodideReady = false;
      
      // Function to notify parent that the iframe is ready for testing
      function notifyReady() {
        window.pyodideReady = true;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PYODIDE_READY' }, '*');
        }
      }
      
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
                def __init__(self, is_stderr=False):
                    super().__init__()
                    self.is_stderr = is_stderr
                
                def write(self, text):
                    super().write(text)
                    # Send output to JS
                    from js import addOutput
                    addOutput(text, self.is_stderr)
            
            sys.stdout = CaptureIO(is_stderr=False)
            sys.stderr = CaptureIO(is_stderr=True)
            
            # Set up import paths for modules
            import sys
            ${importPathsSetup}
          \`);
          
          // Create a Python virtual filesystem and load all files
          for (const [filename, content] of Object.entries(files)) {
            if (filename.endsWith('.py')) {
              // Create file in Pyodide filesystem
              const pyodideFilename = filename.replace(/\\\\/g, '/');
              window.pyodide.FS.writeFile(pyodideFilename, content);
            }
          }
          
          // Execute the main Python file
          if (files[mainFilePath]) {
            addOutput(\`Running \${mainFilePath}...\n\`);
            
            try {
              // Run the main script
              window.pyodide.runPython(files[mainFilePath]);
              
              // Mark execution as completed
              addOutput('\\nExecution completed');
            } catch (error) {
              // Handle Python execution errors
              addOutput(\`\\nError: \${error.message}\`, true);
              console.error(error);
            }
          } else {
            addOutput(\`Error: Main file "\${mainFilePath}" not found\`, true);
          }
        } catch (error) {
          // Handle Pyodide loading errors
          loader.style.display = 'none';
          addOutput(\`Failed to initialize Python environment: \${error.message}\`, true);
          console.error('Pyodide initialization error:', error);
        } finally {
          // Notify that we're ready for tests
          notifyReady();
        }
      }
      
      // Start the main function
      main();
    </script>
  </body>
</html>
`;
}

// Export using CommonJS style
exports.default = previewTemplate; 