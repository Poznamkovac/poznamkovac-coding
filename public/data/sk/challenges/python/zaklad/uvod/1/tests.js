/**
 * Tests for the Python Hello World challenge
 */
export default class PythonTester {
  constructor() {
    this.previewWindow = null;
  }

  /**
   * Set the preview window reference for all tests
   */
  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  /**
   * Test that the script outputs the correct key
   */
  async test_output() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");

      let stderr = STDERR.textContent;
      if (stderr.length > 0) {
        return {
          details_wrong: `Neočakával som chyby, ale bol nájdený stderr`,
        };
      }

      return {
        details_ok: "Program funguje správne.",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testov: ${error.message}`,
      };
    }
  }
}
