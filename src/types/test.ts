/**
 * Výsledok testu pre úlohu.
 */
export interface Test {
  /** Skóre za správnu odpoveď */
  skore?: number;
  /** Spätná väzba, ak bola úloha vyriešená úspešne. */
  detaily_ok?: string;
  /** Spätná väzba, ak bola úloha vyriešená nesprávne. */
  detaily_zle?: string;
}
