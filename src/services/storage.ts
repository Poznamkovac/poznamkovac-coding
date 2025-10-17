import { openDB, DBSchema, IDBPDatabase } from "idb";
import { i18n } from "../i18n";

interface AppDB extends DBSchema {
  "challenge-data": {
    key: string;
    value: string | number;
  };
}

const DB_NAME = "poznamkovac-coding-db";
const DB_VERSION = 1;
const STORE_NAME = "challenge-data";

// global promise shared across all instances (across multiple tabs/iframes)
let globalDBPromise: Promise<IDBPDatabase<AppDB>> | null = null;

async function initializeDB(): Promise<IDBPDatabase<AppDB>> {
  return await openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
    blocked() {
      alert(i18n.global.t("database.blocked"));
    },
  });
}

class StorageService {
  private async getDB(): Promise<IDBPDatabase<AppDB>> {
    if (!globalDBPromise) {
      globalDBPromise = initializeDB();
    }
    return globalDBPromise;
  }

  async getValue(key: string): Promise<string | number | null> {
    const db = await this.getDB();
    const value = await db.get(STORE_NAME, key);
    return value ?? null;
  }

  async setValue(key: string, value: string | number): Promise<void> {
    const db = await this.getDB();
    await db.put(STORE_NAME, value, key);
  }

  async deleteValue(key: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAME, key);
  }

  private makeChallengeKey(coursePath: string, challengeId: string, suffix: string, language?: string): string {
    const parts = ["challenge", language, coursePath, challengeId, suffix].filter(Boolean);
    return parts.join("_");
  }

  async getChallengeScore(coursePath: string, challengeId: string, language: "sk" | "en"): Promise<number> {
    const key = this.makeChallengeKey(coursePath, challengeId, "score", language);
    const score = await this.getValue(key);
    return typeof score === "number" ? score : typeof score === "string" ? parseInt(score, 10) : 0;
  }

  async setChallengeScore(coursePath: string, challengeId: string, score: number, language: "sk" | "en"): Promise<void> {
    const key = this.makeChallengeKey(coursePath, challengeId, "score", language);
    await this.setValue(key, score);
  }

  async getEditorCode(coursePath: string, challengeId: string, filename: string, language?: string): Promise<string | null> {
    const key = this.makeChallengeKey(coursePath, challengeId, filename, language);
    const code = await this.getValue(key);
    return typeof code === "string" ? code : null;
  }

  async setEditorCode(coursePath: string, challengeId: string, filename: string, code: string, language?: string): Promise<void> {
    const key = this.makeChallengeKey(coursePath, challengeId, filename, language);
    await this.setValue(key, code);
  }

  async deleteEditorCode(coursePath: string, challengeId: string, filename: string, language?: string): Promise<void> {
    const key = this.makeChallengeKey(coursePath, challengeId, filename, language);
    await this.deleteValue(key);
  }

  async getAllChallengeFiles(coursePath: string, challengeId: string, language: "sk" | "en"): Promise<Record<string, string>> {
    const db = await this.getDB();
    const allKeys = await db.getAllKeys(STORE_NAME);
    const prefix = this.makeChallengeKey(coursePath, challengeId, "", language);
    const fileKeys = allKeys.filter((key) => key.startsWith(prefix) && key !== this.makeChallengeKey(coursePath, challengeId, "score", language));

    const result: Record<string, string> = {};
    for (const key of fileKeys) {
      const filename = key.substring(prefix.length);
      const content = await db.get(STORE_NAME, key);
      if (typeof content === "string") {
        result[filename] = content;
      }
    }
    return result;
  }

  async getFileSystemStructure(coursePath: string, challengeId: string): Promise<string[] | null> {
    const key = `fs_structure_${coursePath}_${challengeId}`;
    const structure = await this.getValue(key);
    return typeof structure === "string" ? JSON.parse(structure) : null;
  }

  async setFileSystemStructure(coursePath: string, challengeId: string, filenames: string[]): Promise<void> {
    const key = `fs_structure_${coursePath}_${challengeId}`;
    await this.setValue(key, JSON.stringify(filenames));
  }

  async clearChallengeData(coursePath: string, challengeId: string): Promise<void> {
    const db = await this.getDB();
    const allKeys = await db.getAllKeys(STORE_NAME);
    const prefix = `challenge_${coursePath}_${challengeId}_`;
    const fsKey = `fs_structure_${coursePath}_${challengeId}`;

    const keysToDelete = allKeys.filter((key) => key.startsWith(prefix) || key === fsKey);
    for (const key of keysToDelete) {
      await db.delete(STORE_NAME, key);
    }
  }

  async getFailedAttempts(coursePath: string, challengeId: string): Promise<number> {
    const key = this.makeChallengeKey(coursePath, challengeId, "failed_attempts");
    const attempts = await this.getValue(key);
    return typeof attempts === "number" ? attempts : typeof attempts === "string" ? parseInt(attempts, 10) : 0;
  }

  async incrementFailedAttempts(coursePath: string, challengeId: string): Promise<number> {
    const current = await this.getFailedAttempts(coursePath, challengeId);
    const newCount = current + 1;
    const key = this.makeChallengeKey(coursePath, challengeId, "failed_attempts");
    await this.setValue(key, newCount);
    return newCount;
  }

  async resetFailedAttempts(coursePath: string, challengeId: string): Promise<void> {
    const key = this.makeChallengeKey(coursePath, challengeId, "failed_attempts");
    await this.deleteValue(key);
  }
}

export const storageService = new StorageService();
