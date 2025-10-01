/**
 * Preview template for SQLite challenges
 * @param {string} mainFile - The main file to execute
 * @param {object} fileSystem - The virtual file system
 * @param {function} t - Translation function
 * @returns {string} - HTML content to render in the preview iframe with SQLite execution via SQL.js
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

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${t("preview.title")}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
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
      #stdout {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
      }
      #stderr {
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
        line-height: 1.4;
        color: #ff5555;
        margin-top: 10px;
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
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
      }
      th, td {
        border: 1px solid #444;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #333;
      }
      tr:nth-child(even) {
        background-color: #222;
      }
      .query-info {
        margin: 5px 0;
        font-style: italic;
        color: #888;
      }
      .result-set {
        margin-bottom: 20px;
        border-left: 3px solid #0f0;
        padding-left: 10px;
      }
      .error-message {
        color: #ff5555;
        border-left: 3px solid #ff5555;
        padding-left: 10px;
        margin: 10px 0;
      }
      .result-metadata {
        display: flex;
        justify-content: space-between;
        font-size: 0.9em;
        color: #888;
        margin-bottom: 5px;
      }
      .execution-time {
        color: #0f0;
        font-size: 0.9em;
        margin: 5px 0;
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
      
      // Define the main file path explicitly
      const mainFilePath = "${mainFile}";
      
      // Flag to indicate when SQL execution is ready
      window.sqlReady = false;
      window.sqlInstance = null;
      window.dbInstance = null;

      // Set up outputs for stdout and stderr
      const stdout = document.getElementById('stdout');
      const stderr = document.getElementById('stderr');
      const loader = document.getElementById('loader');
      const consoleOutput = document.getElementById('console');

      // Performance measurement functions
      let tictime;
      function tic() { tictime = performance.now(); }
      function toc(msg) {
        const dt = performance.now() - tictime;
        return dt;
      }

      // Function to add output to the console
      function addStdout(text) {
        const line = document.createElement('div');
        line.innerHTML = text;
        stdout.appendChild(line);

        // Show console if there's content
        if (stdout.children.length > 0) {
          consoleOutput.classList.add('has-content');
        }
      }

      // Function to add error output to the console
      function addStderr(text) {
        const line = document.createElement('div');
        line.className = 'error-message';
        line.textContent = text;
        stderr.appendChild(line);

        // Show console if there's content
        if (stderr.children.length > 0) {
          consoleOutput.classList.add('has-content');
        }
      }

      // Variable to track the query execution count
      let queryCounter = 0;

      // Function to clean the SQL environment for re-execution
      function cleanSqlEnvironment() {
        if (!window.dbInstance || !window.sqlInstance) return false;

        try {
          // Clear stdout/stderr
          stdout.innerHTML = '';
          stderr.innerHTML = '';
          consoleOutput.classList.remove('has-content');

          // Reset query counter
          queryCounter = 0;

          // Close and recreate database to clear all data
          window.dbInstance.close();
          window.dbInstance = new window.sqlInstance.Database();

          // Re-execute init.sql if it exists
          if (files["init.sql"]) {
            try {
              window.dbInstance.run(files["init.sql"]);
            } catch (error) {
              addStderr('${t("sqlite.errorInitSql")}: ' + error.message);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.warn('Error cleaning SQL environment:', error);
          return false;
        }
      }

      // Function to format SQL results as HTML table
      function formatResults(columns, values, executionTime) {
        // Increment query counter for each result set
        queryCounter++;
        
        if (!values || values.length === 0) {
          return '<div class="result-set query-' + queryCounter + '-output empty-result">' +
                 '<div class="query-info">' + '${t("sqlite.queryExecutedNoResults")}' + '</div>' +
                 '<div class="execution-time">' + '${t("sqlite.executionTime")}' + ': ' + executionTime.toFixed(2) + 'ms</div>' +
                 '</div>';
        }
        
        let html = '<div class="result-set query-' + queryCounter + '-output">';
        
        // Add execution time and metadata
        html += '<div class="execution-time">' + '${t("sqlite.executionTime")}' + ': ' + executionTime.toFixed(2) + 'ms</div>';
        html += '<div class="result-metadata">' +
                '<span class="row-count">' + values.length + ' ' + 
                (values.length !== 1 ? '${t("sqlite.rows")}' : '${t("sqlite.row")}') + '</span>' +
                '<span class="column-count">' + columns.length + ' ' + 
                (columns.length !== 1 ? '${t("sqlite.columns")}' : '${t("sqlite.column")}') + '</span>' +
                '</div>';
        
        // Create table
        html += '<table class="result-table">';
        
        // Add header row
        html += '<thead><tr>';
        columns.forEach(column => {
          html += \`<th>\${column}</th>\`;
        });
        html += '</tr></thead>';
        
        // Add data rows
        html += '<tbody>';
        values.forEach((row, rowIndex) => {
          html += '<tr class="row-' + rowIndex + '">';
          row.forEach((cell, cellIndex) => {
            html += \`<td class="cell-\${cellIndex}">\${cell === null ? '${t("sqlite.null")}' : cell}</td>\`;
          });
          html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table></div>';
        return html;
      }
      
      // Function to execute SQL code (reusable)
      function executeSqlCode() {
        const db = window.dbInstance;

        if (!db) {
          addStderr('Chyba: SQL prostredie nie je inicializované');
          return;
        }

        // Execute the main SQL file
        if (files[mainFilePath]) {
          try {
            // Split SQL statements by semicolon
            const statements = files[mainFilePath].split(';').filter(stmt => stmt.trim());

            for (const statement of statements) {
              if (!statement.trim()) continue;

              const statementDisplay = statement.trim();
              const truncatedStatement = statementDisplay.length > 70 ?
                statementDisplay.substring(0, 70) + '...' :
                statementDisplay;

              try {
                tic(); // Start timing statement execution
                const result = db.exec(statement);
                const executionTime = toc(); // Get execution time

                addStdout('<div class="query-info">' + '${t("sqlite.executing")}' + ': ' + truncatedStatement + '</div>');

                if (result.length > 0) {
                  // If the statement returned results, display them
                  result.forEach(({ columns, values }) => {
                    addStdout(formatResults(columns, values, executionTime));
                  });
                } else {
                  // For statements that don't return results (like INSERT, UPDATE, etc.)
                  addStdout('<div class="result-set query-' + queryCounter + '-output">' +
                           '<div class="query-info">' + '${t("sqlite.queryExecutedNoResults")}' + '</div>' +
                           '<div class="execution-time">' + '${t("sqlite.executionTime")}' + ': ' + executionTime.toFixed(2) + 'ms</div>' +
                           '</div>');

                  // Still increment the query counter for non-result queries
                  queryCounter++;
                }
              } catch (error) {
                addStderr('${t("sqlite.errorExecutingStatement")}: ' + error.message);
                addStdout('<div class="query-info">' + '${t("sqlite.failedStatement")}' + ': ' + truncatedStatement + '</div>');
              }
            }
          } catch (error) {
            addStderr('${t("sqlite.errorExecutingSql")}: ' + error.message);
          }
        } else {
          addStderr('${t("sqlite.errorMainFileNotFound")}: ' + mainFilePath);
        }
      }

      // Expose the re-execution function globally
      window.reExecuteSQL = function() {
        window.sqlReady = false;
        const cleaned = cleanSqlEnvironment();
        if (cleaned) {
          executeSqlCode();
        } else {
          // Fallback to full reload if cleanup failed
          window.location.reload();
          return;
        }
        window.sqlReady = true;
        notifyReady();
      };

      // Main function to initialize SQL.js and run SQL code
      async function main() {
        tic();
        try {
          // Check if SQL.js is already initialized
          if (window.sqlInstance && window.dbInstance) {
            // Just re-execute code, don't reinitialize
            window.reExecuteSQL();
            return;
          }

          // Initialize SQL.js with proper WASM file location configuration (only once)
          const sqlPromise = initSqlJs({
            locateFile: filename => \`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/\${filename}\`
          });

          const SQL = await sqlPromise;
          window.sqlInstance = SQL;
          window.dbInstance = new SQL.Database();

          // Execute init.sql if it exists
          if (files["init.sql"]) {
            try {
              window.dbInstance.run(files["init.sql"]);
            } catch (error) {
              addStderr('${t("sqlite.errorInitSql")}: ' + error.message);
            }
          }

          // Hide loader once SQL.js is loaded
          loader.style.display = 'none';

          // Execute SQL code for the first time
          executeSqlCode();
        } catch (error) {
          loader.style.display = 'none';
          addStderr('${t("sqlite.failedToInitialize")}: ' + error.message);
        } finally {
          // Notify that we're ready for tests
          notifyReady();
        }
      }
      
      // Function to notify parent that the iframe is ready for testing
      function notifyReady(failure = false) {
        window.sqlReady = true;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'PREVIEW_READY', language: 'sqlite', failure }, '*');
        }
      }

      // Start the main function
      main();
      
      // Also notify on DOM content loaded (safety measure)
      document.addEventListener('DOMContentLoaded', function() {
        // Mark a setTimeout to check for readiness periodically
        let readyCheckCount = 0;
        const checkSqlReady = setInterval(() => {
          readyCheckCount++;
          if (window.sqlReady) {
            clearInterval(checkSqlReady);
          } else if (readyCheckCount > 10) {
            // After ~5 seconds, give up and notify anyway
            window.sqlReady = true; // Force ready state
            notifyReady(true); // Notify with failure=true
            clearInterval(checkSqlReady);
          }
        }, 500);
      });
      
      // Absolute fallback - in case all else fails, ensure we notify after 30 seconds
      setTimeout(() => {
        if (!window.sqlReady) {
          console.warn('${t("preview.loadingTimeout")}');
          window.sqlReady = true;
          notifyReady(true); // Notify with failure=true
        }
      }, 30000);
    </script>
  </body>
</html>
`;
}

exports.default = previewTemplate;
