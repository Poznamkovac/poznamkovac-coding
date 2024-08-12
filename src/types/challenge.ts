/**
 * Dáta o úlohe.
 */
export interface ChallengeData {
  /** Názov/nadpis úlohy. Nepodporuje HTML tagy. */
  nazov: string;
  /** Zadanie úlohy. Môže obsahovať HTML tagy. */
  zadanie: string;
  pociatocnyKod: {
    /**
     * Počiatočný HTML kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    html?: string | string[];
    /**
     * Počiatočný CSS kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    css?: string | string[];
    /**
     * Počiatočný JavaScript kód editora. Ak je `null`, editor sa nezobrazí.
     * Prvý element je kód, druhý element je, či je editor read-only.
     */
    js?: string | string[];
  };
}

/**
 * Zoznam úloh v kategórii.
 */
export interface ChallengeList {
  /** ID úlohy => dáta o úlohe. */
  [id: string]: ChallengeData;
}
