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

class StorageService {
  private dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

  constructor() {
    this.dbPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<IDBPDatabase<AppDB>> {
    try {
      return await openDB<AppDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Create the store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
        blocked() {
          const message = i18n.global.t("database.blocked");
          console.warn(message);
          alert(message);
        },
        blocking() {
          console.warn("This tab is blocking a database upgrade in another tab.");
        },
      });
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private async getDB(): Promise<IDBPDatabase<AppDB>> {
    try {
      if (!this.dbPromise) {
        this.dbPromise = this.initializeDB();
      }

      const db = await this.dbPromise;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        throw new Error("Database store missing after initialization");
      }

      return db;
    } catch (error) {
      console.error("Database connection error:", error);

      const userConfirmed = confirm(i18n.global.t("database.error"));

      if (userConfirmed) {
        try {
          const oldDb = await this.dbPromise?.catch(() => null);
          if (oldDb) {
            oldDb.close();
          }
        } catch {}

        await new Promise<void>((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onblocked = () => {
            console.warn("Database deletion blocked");
            resolve();
          };
        });

        console.log("Database deleted, reloading page...");
      }

      window.location.reload();
      throw error; // for ts
    }
  }

  async getValue(key: string): Promise<string | number | null> {
    try {
      const db = await this.getDB();
      const value = await db.get(STORE_NAME, key);
      return value !== undefined ? value : null;
    } catch (error) {
      console.error("Error getting value from IndexedDB:", error);
      return localStorage.getItem(key);
    }
  }

  async setValue(key: string, value: string | number): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(STORE_NAME, value, key);
    } catch (error) {
      console.error("Error setting value in IndexedDB:", error);
      localStorage.setItem(key, value.toString());
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.error("Error deleting value from IndexedDB:", error);
      localStorage.removeItem(key);
    }
  }

  async getChallengeScore(coursePath: string, challengeId: string, language: "sk" | "en"): Promise<number> {
    const key = `challenge_${language}_${coursePath}_${challengeId}_score`;
    const score = await this.getValue(key);
    return typeof score === "number" ? score : typeof score === "string" ? parseInt(score, 10) : 0;
  }

  async setChallengeScore(coursePath: string, challengeId: string, score: number, language: "sk" | "en"): Promise<void> {
    const key = `challenge_${language}_${coursePath}_${challengeId}_score`;
    await this.setValue(key, score);
  }

  async getEditorCode(coursePath: string, challengeId: string, filename: string): Promise<string | null> {
    const key = `challenge_${coursePath}_${challengeId}_${filename}`;
    const code = await this.getValue(key);
    return typeof code === "string" ? code : null;
  }

  async setEditorCode(coursePath: string, challengeId: string, filename: string, code: string): Promise<void> {
    const key = `challenge_${coursePath}_${challengeId}_${filename}`;
    await this.setValue(key, code);
  }

  async deleteEditorCode(coursePath: string, challengeId: string, filename: string): Promise<void> {
    const key = `challenge_${coursePath}_${challengeId}_${filename}`;
    await this.deleteValue(key);
  }

  async getAllChallengeFiles(coursePath: string, challengeId: string, language: "sk" | "en"): Promise<Record<string, string>> {
    try {
      const db = await this.getDB();
      const allKeys = await db.getAllKeys(STORE_NAME);
      const prefix = `challenge_${language}_${coursePath}_${challengeId}_`;

      const fileKeys = allKeys.filter((key) => key.startsWith(prefix) && key !== `${prefix}score`);

      const result: Record<string, string> = {};

      for (const key of fileKeys) {
        const filename = key.substring(prefix.length);
        const content = await db.get(STORE_NAME, key);
        if (typeof content === "string") {
          result[filename] = content;
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting all challenge files:", error);
      return {};
    }
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
    try {
      const db = await this.getDB();
      const allKeys = await db.getAllKeys(STORE_NAME);
      const prefix = `challenge_${coursePath}_${challengeId}_`;
      const fsKey = `fs_structure_${coursePath}_${challengeId}`;

      const keysToDelete = allKeys.filter((key) => key.startsWith(prefix) || key === fsKey);
      for (const key of keysToDelete) {
        await db.delete(STORE_NAME, key);
      }
    } catch (error) {
      console.error("Error clearing challenge data:", error);
    }
  }

  async getFailedAttempts(coursePath: string, challengeId: string): Promise<number> {
    const key = `challenge_${coursePath}_${challengeId}_failed_attempts`;
    const attempts = await this.getValue(key);
    return typeof attempts === "number" ? attempts : typeof attempts === "string" ? parseInt(attempts, 10) : 0;
  }

  async incrementFailedAttempts(coursePath: string, challengeId: string): Promise<number> {
    const current = await this.getFailedAttempts(coursePath, challengeId);
    const newCount = current + 1;
    const key = `challenge_${coursePath}_${challengeId}_failed_attempts`;
    await this.setValue(key, newCount);
    return newCount;
  }

  async resetFailedAttempts(coursePath: string, challengeId: string): Promise<void> {
    const key = `challenge_${coursePath}_${challengeId}_failed_attempts`;
    await this.deleteValue(key);
  }
}

export const storageService = new StorageService();
