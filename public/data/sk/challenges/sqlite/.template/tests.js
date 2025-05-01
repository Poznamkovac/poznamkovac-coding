export default class SQLiteTester {
  constructor() {
    this.previewWindow = null;
  }

  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  async test_zakladny_vystup() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");

      let stderr = STDERR.textContent;
      if (stderr.length > 0) {
        return {
          details_wrong: `Vyskytla sa chyba: ${stderr}`,
        };
      }

      return {
        details_ok: "Žiadne chyby v SQL vykonaní!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }
}
