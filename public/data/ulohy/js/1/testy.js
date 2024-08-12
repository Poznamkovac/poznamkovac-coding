export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_funkcia(window) {
    if (typeof window.pozdrav !== "function") return {
      detaily_zle: 'Funkcia nie je správne definovaná.',
    };

    let vratila = window.pozdrav();
    if (vratila !== "ahoj") return {
      detaily_zle: `Funkcia nevracia "ahoj", ale <code>${vratila}</code>`,
    };

    return {
      skore: 1,
      detaily_ok: `Funkcia vrátila <code>${vratila}</code>.`,
    };
  }
}
