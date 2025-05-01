export default class PythonTester {
  constructor() {
    this.previewWindow = null;
  }

  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  async test_druhy_vysledok_dotazu() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");
      let stderr = STDERR.textContent;
      if (stderr.length > 0) {
        return {
          details_wrong: `Nemôžem testovať výsledky z dôvodu SQL chyby: ${stderr}`,
        };
      }

      const druhyVysledokDotazu = this.previewWindow.document.querySelector(".query-2-output");
      if (!druhyVysledokDotazu) {
        return {
          details_wrong: "Nenašiel sa druhý výsledok dotazu. Uistite sa, že máte aspoň dva SQL dotazy vo vašom riešení.",
        };
      }

      const bunkaEmail = druhyVysledokDotazu.querySelector(".row-0 .cell-2");
      if (!bunkaEmail) {
        return {
          details_wrong: "Nemôžem nájsť bunku s emailom v druhom výsledku dotazu.",
        };
      }

      if (bunkaEmail.textContent !== "jane@example.com") {
        return {
          details_wrong: `Očakával som email "jane@example.com", ale našiel som: "${bunkaEmail.textContent}"`,
        };
      }

      return {
        details_ok: "Druhý dotaz správne vracia 1 riadok s jane@example.com v druhom stĺpci!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }
}
