export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_ma_odsek(window) {
    const paragraph = window.document.getElementsByTagName("p")[0];

    if (!paragraph?.textContent?.toLowerCase()?.includes("ahoj")) return {
      detaily_zle: 'Nebol nájdený žiadny odsek s textom "ahoj". Skús: <code>&lt;p&gt;ahoj&lt;/p&gt;</code>',
    };

    return {
      skore: 1,
      detaily_ok: "Super!",
    };
  }
}
