import { fetchTextAsset } from "../utils/fetchAsset";

export interface CellTest {
  cellIndex: number;
  testCode: string;
  language: string;
}

export function parseTestMd(testMdContent: string, editableCellIndices: number[], language: string): CellTest[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const tests: CellTest[] = [];

  let match;
  let testBlockIndex = 0;

  while ((match = codeBlockRegex.exec(testMdContent)) !== null) {
    const detectedLanguage = match[1] || language;
    const code = match[2].trim();

    if (!code) {
      testBlockIndex++;
      continue;
    }

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

export async function fetchTestMd(coursePath: string, challengeId: string, language: string): Promise<string | null> {
  return await fetchTextAsset(`/${language}/data/${coursePath}/${challengeId}/test.md`);
}
