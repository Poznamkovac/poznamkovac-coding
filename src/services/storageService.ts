import { openDB, DBSchema, IDBPDatabase } from "idb";

interface AppDB extends DBSchema {
  "challenge-data": {
    key: string;
    value: string | number;
  };
}

const DB_NAME = "poznamkovac-coding-db";
const DB_VERSION = 1;
const STORE_NAME = "challenge-data";

/**
 * Service for handling IndexedDB storage operations
 */
class StorageService {
  private dbPromise: Promise<IDBPDatabase<AppDB>>;

  constructor() {
    this.dbPromise = this.initializeDB();
  }

  /**
   * Initialize the IndexedDB database
   */
  private initializeDB(): Promise<IDBPDatabase<AppDB>> {
    return openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  /**
   * Get a value from IndexedDB
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  async getValue(key: string): Promise<string | number | null> {
    try {
      const db = await this.dbPromise;
      const value = await db.get(STORE_NAME, key);
      // Handle undefined (not found) case
      return value !== undefined ? value : null;
    } catch (error) {
      console.error("Error getting value from IndexedDB:", error);
      // Fallback to localStorage if IndexedDB fails
      return localStorage.getItem(key);
    }
  }

  /**
   * Set a value in IndexedDB
   * @param key The key to store the value under
   * @param value The value to store
   */
  async setValue(key: string, value: string | number): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put(STORE_NAME, value, key);
    } catch (error) {
      console.error("Error setting value in IndexedDB:", error);
      // Fallback to localStorage if IndexedDB fails
      localStorage.setItem(key, value.toString());
    }
  }

  /**
   * Delete a value from IndexedDB
   * @param key The key to delete
   */
  async deleteValue(key: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.delete(STORE_NAME, key);
    } catch (error) {
      console.error("Error deleting value from IndexedDB:", error);
      localStorage.removeItem(key);
    }
  }

  /**
   * Migrate data from localStorage to IndexedDB for a specific prefix
   * @param keyPrefix The prefix of localStorage keys to migrate
   */
  async migrateFromLocalStorage(keyPrefix: string): Promise<void> {
    try {
      // Find all localStorage keys with the given prefix
      const keysToMigrate = Object.keys(localStorage).filter((key) => key.startsWith(keyPrefix));

      // Migrate each key-value pair
      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Try to parse as number if it's numeric
          const parsedValue = /^\d+$/.test(value) ? parseInt(value, 10) : value;
          await this.setValue(key, parsedValue);
        }
      }

      console.log(`Successfully migrated ${keysToMigrate.length} items from localStorage to IndexedDB`);
    } catch (error) {
      console.error("Error migrating data from localStorage:", error);
    }
  }

  /**
   * Get assignment score
   * @param categoryId The category ID
   * @param challengeId The challenge ID
   * @returns The score or 0 if not found
   */
  async getChallengeScore(categoryId: string, challengeId: string): Promise<number> {
    const key = `uloha_${categoryId}_${challengeId}_skore`;
    const score = await this.getValue(key);
    return typeof score === "number" ? score : typeof score === "string" ? parseInt(score, 10) : 0;
  }

  /**
   * Set assignment score
   * @param categoryId The category ID
   * @param challengeId The challenge ID
   * @param score The score to save
   */
  async setChallengeScore(categoryId: string, challengeId: string, score: number): Promise<void> {
    const key = `uloha_${categoryId}_${challengeId}_skore`;
    await this.setValue(key, score);
  }

  /**
   * Get editor code
   * @param categoryId The category ID
   * @param challengeId The challenge ID
   * @param filename The filename to retrieve
   * @returns The stored code or null if not found
   */
  async getEditorCode(categoryId: string, challengeId: string, filename: string): Promise<string | null> {
    const key = `uloha_${categoryId}_${challengeId}_${filename}`;
    const code = await this.getValue(key);
    return typeof code === "string" ? code : null;
  }

  /**
   * Set editor code
   * @param categoryId The category ID
   * @param challengeId The challenge ID
   * @param filename The filename to save
   * @param code The code to save
   */
  async setEditorCode(categoryId: string, challengeId: string, filename: string, code: string): Promise<void> {
    const key = `uloha_${categoryId}_${challengeId}_${filename}`;
    await this.setValue(key, code);
  }

  /**
   * Get all saved files for a challenge
   * @param categoryId The category ID
   * @param challengeId The challenge ID
   * @returns Object with filenames as keys and content as values
   */
  async getAllChallengeFiles(categoryId: string, challengeId: string): Promise<Record<string, string>> {
    try {
      const db = await this.dbPromise;
      const allKeys = await db.getAllKeys(STORE_NAME);
      const prefix = `uloha_${categoryId}_${challengeId}_`;

      const fileKeys = allKeys.filter(
        (key) => key.startsWith(prefix) && key !== `${prefix}skore` // Exclude score
      );

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
}

// Export a singleton instance
export const storageService = new StorageService();

// Migrate existing data from localStorage on initialization
storageService.migrateFromLocalStorage("uloha_");
