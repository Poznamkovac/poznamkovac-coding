export default class PythonTester {
  constructor() {
    this.previewWindow = null;
  }

  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  async test_output() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");

      let stderr = STDERR.textContent;
      if (stderr.length > 0) {
        return {
          details_wrong: `Vyskytla sa chyba.`,
        };
      }

      return {
        details_ok: "Program funguje správne!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testov: ${error.message}`,
      };
    }
  }
}
