export default class HTMLChallengeTester {
  /** @param {Window} window */
  test_responzivny_layout(window) {
    const style = window.getComputedStyle(window.document.querySelector(".container"));
    const columns = window.document.querySelectorAll(".column");

    if (columns.length !== 3)
      return {
        detaily_zle: 'Neboli nájdené tri stĺpce s triedou "column".',
      };

    const testResponsive = (width, expectedDisplay) => {
      window.innerWidth = width;
      //window.dispatchEvent(new Event("resize"));
      const display = window.getComputedStyle(columns[0]).display;
      console.log(display, expectedDisplay);
      return display === expectedDisplay;
    };

    if (!testResponsive(1000, "inline-block") || !testResponsive(600, "block")) // FIXME: šírka sa nemení, test reaguje na akutálnu vizuálnu šírku náhľadu
      return {
        detaily_zle: "Layout nie je responzívny. Použite media query pre obrazovky menšie ako 768px.",
      };

    const uniqueBackgrounds = new Set();
    for (let column of columns) {
      const style = window.getComputedStyle(column);
      if (style.padding !== "20px")
        return {
          detaily_zle: "Nie všetky stĺpce majú padding 20px.",
        };
      uniqueBackgrounds.add(style.backgroundColor);
    }

    if (uniqueBackgrounds.size !== 3)
      return {
        detaily_zle: "Nie všetky stĺpce majú unikátne pozadie.",
      };

    return {
      skore: 15,
      detaily_ok: "Výborne! Vytvoril si správny responzívny layout s troma stĺpcami.",
    };
  }
}
