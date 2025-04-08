export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_stylovanie(window) {
    const paragraph = window.document.getElementById("specialny-text");
    const style = window.getComputedStyle(paragraph);

    if (style.color !== "rgb(0, 0, 255)")
      return {
        detaily_zle: "Text nie je modrý. Použite vlastnosť <code>color: blue;</code>.",
      };

    if (style.fontSize !== "18px")
      return {
        detaily_zle: "Veľkosť písma nie je 18 pixelov. Použite vlastnosť <code>font-size: 18px;</code>.",
      };

    if (style.fontWeight !== "700" && style.fontWeight !== "bold")
      return {
        detaily_zle: "Text nie je tučný. Použite vlastnosť <code>font-weight: bold;</code>.",
      };

    return {
      skore: 5,
      detaily_ok: "Výborne! Text je správne naštýlovaný.",
    };
  }
}
