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
          details_wrong: `An error occurred.`,
        };
      }

      return {
        details_ok: "The program works correctly!",
      };
    } catch (error) {
      return {
        details_wrong: `Test error: ${error.message}`,
      };
    }
  }
}
