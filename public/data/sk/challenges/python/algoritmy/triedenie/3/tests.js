export default class PythonTester {
  constructor() {
    this.previewWindow = null;
  }

  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  async test_vystup() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");

      let stderr = STDERR.textContent;
      if (stderr.length > 0) {
        return {
          details_wrong: `Vyskytla sa chyba.`,
        };
      }

      return {
        details_ok: "Počas behu programu nenastali žiadne chyby.",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testov: ${error.message}`,
      };
    }
  }
}
