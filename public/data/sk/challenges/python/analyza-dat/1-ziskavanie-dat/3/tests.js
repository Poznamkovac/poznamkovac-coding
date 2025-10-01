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

  async test_nizky_stav() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('Notebook') || !stdout.includes('Monitor')) {
        return {
          details_wrong: "Filter pre nízky stav (<10) nefunguje správne.",
        };
      }

      return {
        score: 1,
        details_ok: "Filter pre nízky stav funguje správne!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_kategoria_elektro() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      const elektroCount = (stdout.match(/Elektro/g) || []).length;
      if (elektroCount < 3) {
        return {
          details_wrong: "Filter pre kategóriu 'Elektro' nefunguje správne.",
        };
      }

      return {
        score: 1,
        details_ok: "Filter pre kategóriu funguje správne!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }

  async test_celkova_hodnota() {
    try {
      const STDOUT = this.previewWindow.document.getElementById("stdout");
      let stdout = STDOUT.textContent;

      if (!stdout.includes('5920')) {
        return {
          details_wrong: "Celková hodnota skladu (5920) nie je správna.",
        };
      }

      return {
        score: 1,
        details_ok: "Celková hodnota skladu je správne vypočítaná!",
      };
    } catch (error) {
      return {
        details_wrong: `Chyba testu: ${error.message}`,
      };
    }
  }
}
