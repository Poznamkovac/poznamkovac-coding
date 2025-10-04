import { BaseCodeRunner, type ExecutionResult } from "./base";
import initSqlJs, { type Database } from "sql.js";

export class SQLiteRunner extends BaseCodeRunner {
  language = "sqlite";
  private SQL: any = null;
  private db: Database | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load sql.js with CDN
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize SQL.js:", error);
      throw error;
    }
  }

  async execute(files: Record<string, string>, mainFile: string): Promise<ExecutionResult> {
    console.log("[SQLiteRunner] Starting execution");
    console.log("[SQLiteRunner] Files:", Object.keys(files));
    console.log("[SQLiteRunner] Main file:", mainFile);

    if (!this.SQL) {
      const error = "SQLite runtime not initialized";
      console.error("[SQLiteRunner]", error);
      return {
        success: false,
        error,
      };
    }

    try {
      // Create a new database instance
      this.db = new this.SQL.Database();
      if (!this.db) {
        const error = "Failed to create database instance";
        console.error("[SQLiteRunner]", error);
        return {
          success: false,
          error,
        };
      }

      let htmlContent = `<html><head><style>body { background: transparent; color: #fff; font-family: system-ui; margin: 0; padding: 16px; }</style></head><body>`;
      let textOutput = "";
      let hasError = false;

      // Process schema.sql if it exists
      if (files["schema.sql"]) {
        try {
          console.log("[SQLiteRunner] Running schema.sql");
          this.db.run(files["schema.sql"]);
        } catch (error: any) {
          console.error("[SQLiteRunner] Schema error:", error);
          return {
            success: false,
            error: `Schema error: ${error.message}`,
          };
        }
      }

      // Process data.sql if it exists (sample data)
      if (files["data.sql"]) {
        try {
          console.log("[SQLiteRunner] Running data.sql");
          this.db.run(files["data.sql"]);
        } catch (error: any) {
          console.error("[SQLiteRunner] Data insertion error:", error);
          return {
            success: false,
            error: `Data insertion error: ${error.message}`,
          };
        }
      }

      // Execute the main SQL file
      const mainContent = files[mainFile];
      if (!mainContent) {
        const error = `Main file '${mainFile}' not found`;
        console.error("[SQLiteRunner]", error);
        return {
          success: false,
          error,
        };
      }

      console.log("[SQLiteRunner] Main content:", mainContent);

      // Remove SQL comments and split by semicolon
      const cleanedContent = mainContent
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

      console.log("[SQLiteRunner] Cleaned content:", cleanedContent);

      const queries = cleanedContent
        .split(";")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      console.log("[SQLiteRunner] Queries to execute:", queries);

      for (const query of queries) {
        try {
          console.log("[SQLiteRunner] Executing query:", query);
          const startTime = performance.now();
          const result = this.db.exec(query);
          const endTime = performance.now();
          const executionTime = (endTime - startTime).toFixed(2);

          console.log("[SQLiteRunner] Query result:", result);

          htmlContent += `<div style="margin-bottom: 20px;">`;
          htmlContent += `<div style="color: #666; font-size: 12px; margin-bottom: 8px;">Query executed in ${executionTime} ms</div>`;

          if (result.length > 0) {
            // Format results as HTML table
            for (const table of result) {
              htmlContent += `<table style="border-collapse: collapse; width: 100%; border: 1px solid #333;">`;

              // Column headers
              htmlContent += `<thead><tr>`;
              for (const col of table.columns) {
                htmlContent += `<th style="border: 1px solid #333; padding: 8px 12px; text-align: left; color: #fff; font-weight: 600;">${col}</th>`;
              }
              htmlContent += `</tr></thead>`;

              // Rows
              htmlContent += `<tbody>`;
              for (const row of table.values) {
                htmlContent += `<tr>`;
                for (const cell of row) {
                  htmlContent += `<td style="border: 1px solid #333; padding: 8px 12px; color: #ccc;">${cell}</td>`;
                }
                htmlContent += `</tr>`;
              }
              htmlContent += `</tbody></table>`;

              htmlContent += `<div style="color: #666; font-size: 12px; margin-top: 8px;">${table.values.length} row(s) returned</div>`;

              // Build text output for test runner
              textOutput += table.columns.join(" | ") + "\n";
              for (const row of table.values) {
                textOutput += row.join(" | ") + "\n";
              }
            }
          } else {
            // Query executed successfully but returned no results
            htmlContent += `<div style="color: #4ade80;">✓ Query executed successfully (no results returned)</div>`;
          }

          htmlContent += `</div>`;
        } catch (error: any) {
          console.error("[SQLiteRunner] Query execution error:", error);
          console.error("[SQLiteRunner] Failed query:", query);
          hasError = true;
          htmlContent += `<div style="margin-bottom: 20px; color: #ef4444;">`;
          htmlContent += `<strong>Error:</strong> ${error.message}`;
          htmlContent += `</div>`;
        }
      }

      htmlContent += `</body></html>`;

      console.log("[SQLiteRunner] Execution complete. Success:", !hasError);

      return {
        success: !hasError,
        output: textOutput.trim(),
        htmlContent: htmlContent,
        error: hasError ? "One or more queries failed" : undefined,
      };
    } catch (error: any) {
      console.error("[SQLiteRunner] Unexpected error:", error);
      console.error("[SQLiteRunner] Stack trace:", error.stack);
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
}
