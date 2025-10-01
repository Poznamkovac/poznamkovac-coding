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

  async test_csv_nacitanie() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('Pondelok') || !stdout.includes('Piatok')) {
        return {
          details_wrong: "CSV súbor nebol načítaný správne. Skontrolujte formát súboru.",
        };
      }

      return {
        score: 1,
        details_ok: "CSV súbor bol načítaný správne!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_celkove_salky() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('279')) {
        return {
          details_wrong: "Celkový počet šálok (279) nie je správny. Použite <code>df['šálky'].sum()</code>.",
        };
      }

      return {
        score: 1,
        details_ok: "Celkový počet šálok je správne vypočítaný!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_celkova_trzba() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('1116')) {
        return {
          details_wrong: "Celková tržba (1116) nie je správna. Použite <code>df['tržba'].sum()</code>.",
        };
      }

      return {
        score: 1,
        details_ok: "Celková tržba je správne vypočítaná!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }
}
