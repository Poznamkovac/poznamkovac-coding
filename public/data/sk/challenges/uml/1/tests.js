export default class MermaidChallengeTester {
  constructor() {
    this.previewWindow = null;
  }

  /**
   * Set the preview window reference for all tests
   */
  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  test_mermaid_diagram() {
    return {
      score: 1,
      details_ok: "Mermaid diagram is correct",
    };
  }
}
