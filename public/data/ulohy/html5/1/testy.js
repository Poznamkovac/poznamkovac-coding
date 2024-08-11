export default class HTMLChallengeTester {
  /** @param {Document} dom */
  test_ma_odsek(dom) {
    const paragraph = dom.querySelector("p");

    if (!paragraph?.textContent?.toLowerCase()?.includes("ahoj")) {
      return {
        detaily_zle: 'Nebol nájdený žiadny odsek s textom "ahoj". Skús: <code>&lt;p&gt;ahoj&lt;/p&gt;</code>',
      };
    }

    return {
      skore: 1,
      detaily_ok: "Super!",
    };
  }
}
