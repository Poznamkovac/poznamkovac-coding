import { type CodeRunner, type ExecutionResult } from "./base";
import initSqlJs, { type Database } from "sql.js";

export class SQLiteRunner implements CodeRunner {
  language = "sqlite";
  private SQL: any = null;
  private db: Database | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      this.initialized = true;
    } catch (error) {
      throw error;
    }
  }

  private buildHtmlContent(results: Array<{ query: string; result: any; error?: string; time: string }>): string {
    const styles = `
      body {
        background: #1e1e1e;
        color: #e0e0e0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        margin: 0;
        padding: 16px;
        line-height: 1.6;
      }

      .query-container {
        margin-bottom: 20px;
      }

      .query-time {
        color: #888;
        font-size: 12px;
        margin-bottom: 8px;
        opacity: 0.8;
      }

      .result-table {
        border-collapse: collapse;
        width: 100%;
        border: 1px solid #404040;
        border-radius: 6px;
        overflow: hidden;
        background: #2d2d2d;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }

      .result-table th {
        border: 1px solid #404040;
        padding: 10px 14px;
        text-align: left;
        color: #fff;
        font-weight: 600;
        background: #3a3a3a;
      }

      .result-table td {
        border: 1px solid #404040;
        padding: 10px 14px;
        color: #e0e0e0;
        background: #2d2d2d;
      }

      .result-table tr:hover td {
        background: #353535;
      }

      .row-count {
        color: #888;
        font-size: 12px;
        margin-top: 8px;
        opacity: 0.8;
      }

      .success-message {
        color: #10b981;
        font-weight: 500;
      }

      .error-message {
        margin-bottom: 20px;
        padding: 12px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        color: #ef4444;
      }
    `;

    const fragment = document.createDocumentFragment();

    results.forEach(({ result, error, time }) => {
      const container = document.createElement("div");
      container.className = "query-container";

      const timeDiv = document.createElement("div");
      timeDiv.className = "query-time";
      timeDiv.textContent = `Query executed in ${time} ms`;
      container.appendChild(timeDiv);

      if (error) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        const strong = document.createElement("strong");
        strong.textContent = "Error: ";
        errorDiv.appendChild(strong);
        errorDiv.appendChild(document.createTextNode(error));
        fragment.appendChild(errorDiv);
      } else if (result && result.length > 0) {
        // create table for results
        result.forEach((tableResult: any) => {
          const table = document.createElement("table");
          table.className = "result-table";

          const thead = document.createElement("thead");
          const headerRow = document.createElement("tr");
          tableResult.columns.forEach((col: string) => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement("tbody");
          tableResult.values.forEach((row: any[]) => {
            const tr = document.createElement("tr");
            row.forEach((cell: any) => {
              const td = document.createElement("td");
              td.textContent = String(cell ?? "");
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          container.appendChild(table);

          const rowCount = document.createElement("div");
          rowCount.className = "row-count";
          rowCount.textContent = `${tableResult.values.length} row(s) returned`;
          container.appendChild(rowCount);
        });
      } else {
        // no results
        const successDiv = document.createElement("div");
        successDiv.className = "success-message";
        successDiv.textContent = "✓ Query executed successfully (no results returned)";
        container.appendChild(successDiv);
      }

      fragment.appendChild(container);
    });

    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${styles}</style>
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>`;
  }

  async execute(
    files: Record<string, string>,
    mainFile: string,
    testJS?: string,
    _options?: { skipCleanup?: boolean },
  ): Promise<ExecutionResult> {
    if (!this.SQL) {
      return {
        success: false,
        error: "SQLite runtime not initialized",
      };
    }

    try {
      // For notebooks, reuse the database; for code challenges, create fresh database
      const isNotebook = _options?.skipCleanup === true;

      if (!isNotebook && this.db) {
        // Clean up existing database for code challenges
        this.db.close();
        this.db = null;
      }

      if (!this.db) {
        this.db = new this.SQL.Database();
      }
      if (!this.db) {
        return {
          success: false,
          error: "Failed to create database instance",
        };
      }

      let textOutput = "";
      let hasError = false;
      let allResults: any[] = [];
      const queryResults: Array<{ query: string; result: any; error?: string; time: string }> = [];

      if (files["schema.sql"]) {
        try {
          this.db.run(files["schema.sql"]);
        } catch (error: any) {
          return {
            success: false,
            error: `Schema error: ${error.message}`,
          };
        }
      }

      if (files["data.sql"]) {
        try {
          this.db.run(files["data.sql"]);
        } catch (error: any) {
          return {
            success: false,
            error: `Data insertion error: ${error.message}`,
          };
        }
      }

      const mainContent = files[mainFile];
      if (!mainContent) {
        return {
          success: false,
          error: `Main file '${mainFile}' not found`,
        };
      }

      const cleanedContent = mainContent
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

      const queries = cleanedContent
        .split(";")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      for (const query of queries) {
        try {
          const startTime = performance.now();
          const result = this.db.exec(query);
          const endTime = performance.now();
          const executionTime = (endTime - startTime).toFixed(2);

          if (result.length > 0) {
            for (const table of result) {
              const tableData = {
                columns: table.columns,
                rows: table.values,
              };
              allResults.push(tableData);

              textOutput += table.columns.join(" | ") + "\n";
              for (const row of table.values) {
                textOutput += row.join(" | ") + "\n";
              }
            }
          }

          queryResults.push({
            query,
            result,
            time: executionTime,
          });
        } catch (error: any) {
          hasError = true;
          queryResults.push({
            query,
            result: null,
            error: error.message,
            time: "0",
          });
        }
      }

      const htmlContent = this.buildHtmlContent(queryResults);

      let testCases;
      if (testJS) {
        const { executeTestJS } = await import("../testRunner");
        const context = {
          language: "sqlite",
          stdout: textOutput.trim(),
          sqlite: {
            db: this.db,
            results: allResults,
          },
        };

        testCases = await executeTestJS(testJS, context);
      }

      // Collect all error messages
      const errorMessages = queryResults
        .filter((qr) => qr.error)
        .map((qr) => `Query: ${qr.query.substring(0, 50)}...\nError: ${qr.error}`)
        .join("\n\n");

      return {
        success: !hasError,
        output: textOutput.trim(),
        htmlContent: htmlContent,
        error: hasError ? errorMessages : undefined,
        testContext: {
          sqlite: {
            db: this.db,
            results: allResults,
          },
        },
        testCases,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  cleanup(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
