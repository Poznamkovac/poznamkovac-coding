export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_cerven(window) {
    const paragraph = window.document.getElementById("cerven");
    const style = window.getComputedStyle(paragraph);

    if (style.color !== "rgb(255, 0, 0)")
      return {
        detaily_zle:
          "Nebol nájdený žiadny odsek s červeným textom. Pamätaj, že ak chceš vybrať element s nejakým ID, použi mriežku<br/> (napr.: <code>#cerven { color: red }</code>)",
      };

    return {
      skore: 1,
      detaily_ok: "Super!",
    };
  }
}
