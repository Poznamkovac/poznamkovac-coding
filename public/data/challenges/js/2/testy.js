export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_scitanie(window) {
    if (typeof window.scitaj !== "function")
      return {
        detaily_zle: 'Funkcia "scitaj" nie je správne definovaná.',
      };

    const testCases = [
      { a: 2, b: 3, expected: 5 },
      { a: -1, b: 1, expected: 0 },
      { a: 0, b: 0, expected: 0 },
      { a: 10, b: 20, expected: 30 },
    ];

    for (const { a, b, expected } of testCases) {
      const result = window.scitaj(a, b);
      if (result !== expected)
        return {
          detaily_zle: `Funkcia nevracia správny výsledok pre vstup <code>${a}</code> a <code>${b}</code>. Očakávaný výsledok: <code>${expected}</code>, ale funkcia vrátila: <code>${result}</code>.`,
        };
    }

    return {
      skore: 5,
      detaily_ok: "Výborne! Funkcia správne sčítava čísla.",
    };
  }
}
