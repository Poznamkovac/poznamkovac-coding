/**
 * Parses test.md files for notebook challenges
 * Extracts test code blocks for each editable cell
 */

export interface CellTest {
  cellIndex: number; // Index in the original cells array (including readonly/hidden)
  testCode: string;
  language: string; // python, javascript, etc.
}

/**
 * Parses test.md markdown file and extracts test code blocks
 * Only returns tests for editable cells (non-readonly, non-hidden)
 *
 * @param testMdContent - The content of test.md file
 * @param editableCellIndices - Indices of editable cells in the original cells array
 * @param language - Language of the notebook (python, web, sqlite)
 * @returns Array of cell tests mapped to their original cell indices
 */
export function parseTestMd(testMdContent: string, editableCellIndices: number[], language: string): CellTest[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const tests: CellTest[] = [];

  let match;
  let testBlockIndex = 0;

  while ((match = codeBlockRegex.exec(testMdContent)) !== null) {
    const detectedLanguage = match[1] || language;
    const code = match[2].trim();

    // Skip empty code blocks (no test for this cell)
    if (!code) {
      testBlockIndex++;
      continue;
    }

    // Map test block index to original cell index
    if (testBlockIndex < editableCellIndices.length) {
      tests.push({
        cellIndex: editableCellIndices[testBlockIndex],
        testCode: code,
        language: detectedLanguage,
      });
    }

    testBlockIndex++;
  }

  return tests;
}

/**
 * Fetches test.md file from server
 */
export async function fetchTestMd(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  try {
    const response = await fetch(`/${language}/data/${coursePath}/${challengeId}/test.md`);
    const contentType = response.headers.get("content-type");
    const isMarkdown = contentType?.includes("markdown") || contentType?.includes("text/plain");

    if (response.ok && isMarkdown) {
      return await response.text();
    }
  } catch {}
  return null;
}
