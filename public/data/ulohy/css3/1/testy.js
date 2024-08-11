export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_cerven(window) {
    const paragraph = window.document.getElementById("cerven");
    const style = window.getComputedStyle(paragraph);

    if (style.color !== "rgb(255, 0, 0)") return {
      detaily_zle: 'Nebol nájdený žiadny odsek s červeným textom. Pamätaj, že ak chceš vybrať element s nejakým ID, použi mriežku<br/> (napr.: <code>#cerven { color: red }</code>)',
    };

    if (!window.document.getElementById("css")?.textContent?.includes("#cerven")) return {
      skore: 0.5,
      detaily_ok: "Text je červený, ale nebol použitý selektor <code>#cerven</code>.",
    }

    return {
      skore: 1,
      detaily_ok: "Super!",
    };
  }
}
