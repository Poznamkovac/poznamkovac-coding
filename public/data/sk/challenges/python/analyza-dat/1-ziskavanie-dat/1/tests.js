export default class PythonTester {
  constructor() {
    this.previewWindow = null;
  }

  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  async test_bez_chyb() {
    try {
      const STDERR = this.previewWindow.document.getElementById("stderr");
      let stderr = STDERR.textContent;

      if (stderr.length > 0) {
        return {
          details_wrong: `Program skončil s chybou: ${stderr}`,
        };
      }

      return {
        score: 1,
        details_ok: "Program beží bez chýb!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_vystup_obsahuje_data() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      // Check for movie names
      if (!stdout.includes('Inception') || !stdout.includes('The Matrix')) {
        return {
          details_wrong: "Výstup neobsahuje očakávané názvy filmov. Skontrolujte, či ste vytvorili DataFrame správne.",
        };
      }

      // Check for ratings
      if (!stdout.includes('8.8') && !stdout.includes('8,8')) {
        return {
          details_wrong: "Výstup neobsahuje hodnotenia filmov.",
        };
      }

      return {
        score: 1,
        details_ok: "DataFrame obsahuje správne dáta!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_pocet_filmov() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('4')) {
        return {
          details_wrong: "Výstup neobsahuje počet filmov (4). Použite <code>len(df)</code>.",
        };
      }

      return {
        score: 1,
        details_ok: "Počet filmov je správne vypočítaný!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_priemerne_hodnotenie() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      // Average should be 8.65
      if (!stdout.includes('8.6') && !stdout.includes('8,6')) {
        return {
          details_wrong: "Výstup neobsahuje priemerné hodnotenie. Použite <code>df['hodnotenie'].mean()</code>.",
        };
      }

      return {
        score: 1,
        details_ok: "Priemerné hodnotenie je správne vypočítané!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }
}
