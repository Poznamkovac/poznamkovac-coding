/**
 * Výsledok testu pre úlohu.
 */
export interface Test {
  /** Skóre za správnu odpoveď */
  score?: number;
  /** Spätná väzba, ak bola úloha vyriešená úspešne. */
  details_ok?: string;
  /** Spätná väzba, ak bola úloha vyriešená nesprávne. */
  details_wrong?: string;
}
