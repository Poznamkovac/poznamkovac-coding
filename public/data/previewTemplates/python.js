/**
 * Preview template for Python challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @param {function} t - Translation function
 * @returns {string} - HTML content to render in the preview iframe with Python execution via Pyodide
 */
function previewTemplate(mainFile, fileSystem, t) {
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
    <title>${t("preview.title")}</title>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js"></script>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: auto;
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
        overflow: auto;
        padding: 10px;
        box-sizing: border-box;
        display: none;
      }
      #console.has-content {
        display: block;
      }
      #stdout, #stderr {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
      }
      #stderr {
        color: #ff5555;
      }
      .stderr-warning {
        color: #ff9800 !important;
      }
      .stderr-error {
        color: #ff5555 !important;
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

      /* Style for matplotlib plots */
      .matplotlib-figure {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: calc(100vh - 20px) !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
      }
    </style>
  </head>
  <body>
    <div id="loader">
      <div class="spinner"></div>
      <p>${t("preview.loading")}</p>
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

        // Detect if this is a warning vs error in stderr
        if (stream === 'stderr') {
          const isWarning = text.includes('Warning:') ||
                           text.includes('UserWarning:') ||
                           text.includes('DeprecationWarning:') ||
                           text.includes('FutureWarning:');

          // Don't show NumPy reload warning at all (additional safeguard)
          if (text.includes('NumPy module was reloaded')) {
            return; // Skip this warning entirely
          }

          if (isWarning) {
            line.className = 'stderr-warning';
          } else {
            line.className = 'stderr-error';
          }
        }

        outputElement.appendChild(line);

        // Show console if there's content
        const console = document.getElementById('console');
        if (outputElement.children.length > 0) {
          console.classList.add('has-content');
        }
      }
      
      // Flag to indicate when Pyodide is ready
      window.pyodideReady = false;
      window.pyodideInstance = null;
      window.micropipInstance = null;

      // Function to clean the Python environment for re-execution
      async function cleanPythonEnvironment() {
        if (!window.pyodideInstance) return;

        const pyodide = window.pyodideInstance;

        try {
          // Clear stdout/stderr
          stdout.innerHTML = '';
          stderr.innerHTML = '';
          const consoleEl = document.getElementById('console');
          consoleEl.classList.remove('has-content');

          // Clear matplotlib plots
          const plots = document.querySelectorAll('[id^="matplotlib_"]');
          plots.forEach(plot => plot.remove());

          // Reset Python environment - clear modules and variables
          await pyodide.runPython(\`
import sys
import gc
import warnings

# Suppress the NumPy reimport warning that occurs during cleanup
warnings.filterwarnings('ignore', message='.*NumPy module was reloaded.*')

# Get list of user modules to delete (keep standard library and critical packages)
# We need to be more aggressive with cleanup, including numpy and matplotlib
user_modules = [mod for mod in list(sys.modules.keys())
                if not mod.startswith('_')
                and mod not in sys.builtin_module_names
                and not mod.startswith('js')
                and not mod.startswith('pyodide')
                and mod not in ['io', 'builtins', 'sys', 'gc', 'warnings']]

# Delete user modules (including numpy, matplotlib, etc.)
for mod in user_modules:
    if mod in sys.modules:
        try:
            del sys.modules[mod]
        except:
            pass

# Clear main namespace, keep only built-ins and our custom classes
main_vars = list(globals().keys())
for var in main_vars:
    if not var.startswith('_') and var not in ['CaptureIO', 'sys', 'io', 'gc', 'warnings', 'addOutput']:
        try:
            del globals()[var]
        except:
            pass

# Force garbage collection
gc.collect()

# Reset IO streams
sys.stdout = CaptureIO('stdout')
sys.stderr = CaptureIO('stderr')
          \`);
        } catch (error) {
          console.warn('Error cleaning Python environment:', error);
          // If cleanup fails, we'll do a full reload
          return false;
        }

        return true;
      }

      // Function to execute Python code (reusable)
      async function executePythonCode() {
        const pyodide = window.pyodideInstance;

        if (!pyodide) {
          addOutput('Chyba: Python prostredie nie je inicializované', 'stderr');
          return;
        }

        // Write updated files to filesystem
        await Promise.all(
          Object.entries(files).map(async ([filename, content]) => {
            const pyodideFilename = filename.replace(/\\\\/g, '/');
            try {
              // Check if file exists and delete it first
              try {
                pyodide.FS.unlink(pyodideFilename);
              } catch (e) {
                // File doesn't exist, that's fine
              }
              pyodide.FS.writeFile(pyodideFilename, content);
            } catch (error) {
              console.warn(\`Failed to write file \${filename}:\`, error);
            }
          })
        );

        // Execute the main Python file
        if (files[mainFilePath]) {
          try {
            // Run the main script
            await pyodide.runPython(files[mainFilePath]);

            // Handle matplotlib plots
            const plots = document.querySelectorAll('[id^="matplotlib_"]');
            plots.forEach(plot => {
              plot.classList.add('matplotlib-figure');
              plot.style.display = 'block';
            });
          } catch (error) {
            // Handle Python execution errors
            addOutput(\`\${error.message}\`, 'stderr');
            console.error(error);
          }
        } else {
          addOutput(\`Chyba: hlavný súbor "\${mainFilePath}" sa nenašiel\`, 'stderr');
        }
      }

      // Expose the re-execution function globally
      window.reExecutePython = async function() {
        window.pyodideReady = false;
        const cleaned = await cleanPythonEnvironment();
        if (cleaned) {
          await executePythonCode();
        } else {
          // Fallback to full reload if cleanup failed
          window.location.reload();
          return;
        }
        window.pyodideReady = true;
        notifyReady();
      };

      // Main function to initialize Pyodide and run Python code
      async function main() {
        try {
          // Check if Pyodide is already initialized
          if (window.pyodideInstance) {
            // Just re-execute code, don't reinitialize
            await window.reExecutePython();
            return;
          }

          // Initialize Pyodide (only once)
          const pyodide = await loadPyodide();
          window.pyodideInstance = pyodide;

          // Load micropip and set up IO capture
          const [micropip] = await Promise.all([
            pyodide.loadPackage("micropip").then(() => pyodide.pyimport("micropip")),
            // Set up stdout/stderr capture in parallel
            pyodide.runPython(\`
              import sys
              import io
              import warnings

              # Suppress NumPy reimport warnings globally
              warnings.filterwarnings('ignore', message='.*NumPy module was reloaded.*')

              class CaptureIO(io.StringIO):
                  def __init__(self, stream_name):
                      super().__init__()
                      self.stream_name = stream_name

                  def write(self, text):
                      super().write(text)
                      if "Matplotlib is building the font cache" in text:
                        return

                      # Send output to JS with stream information
                      from js import addOutput
                      addOutput(text, self.stream_name)

              sys.stdout = CaptureIO('stdout')
              sys.stderr = CaptureIO('stderr')

              # Set up import paths for modules
              import sys
              ${importPathsSetup}
            \`)
          ]);

          window.micropipInstance = micropip;

          // Check for and install requirements.txt if it exists
          if (files["requirements.txt"]) {
            try {
              const requirements = files["requirements.txt"].split("\\n").filter(line => line.trim() && !line.trim().startsWith("#"));
              if (requirements.length > 0) {
                await micropip.install(requirements);
              }
            } catch (error) {
              console.warn("Failed to install requirements:", error);
              addOutput("Warning: Failed to install some requirements from requirements.txt", "stderr");
            }
          }

          // Hide loader once Pyodide is loaded
          loader.style.display = 'none';

          // Execute Python code for the first time
          await executePythonCode();
        } catch (error) {
          // Handle Pyodide loading errors
          loader.style.display = 'none';
          addOutput(\`Nepodarilo sa inicializovať Python prostredie: \${error.message}\`, 'stderr');
          console.error('Chyba inicializácie Pyodide:', error);
        } finally {
          // Notify that we're ready for tests
          notifyReady();
        }
      }
      
      // Function to notify parent that the iframe is ready for testing
      function notifyReady(failure = false) {
        window.pyodideReady = true;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'python', failure }, '*');
        }
      }

      // Start the main function
      main();
      
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
            notifyReady(true); // Notify with failure=true
            clearInterval(checkPyodideReady);
          }
        }, 500);
      });
      
      // Absolute fallback - in case all else fails, ensure we notify after 30 seconds
      setTimeout(() => {
        if (!window.pyodideReady) {
          console.warn('${t("preview.loadingTimeout")}');
          window.pyodideReady = true;
          notifyReady(true); // Notify with failure=true
        }
      }, 30000);
    </script>
  </body>
</html>
`;
}

exports.default = previewTemplate;
