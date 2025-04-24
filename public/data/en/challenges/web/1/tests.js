export default class HTMLChallengeTester {
  constructor() {
    this.previewWindow = null;
  }

  /**
   * Set the preview window reference for all tests
   */
  setPreviewWindow(window) {
    this.previewWindow = window;
  }

  _correct_sort(array, reverse = false) {
    return array.sort((a, b) => {
      return reverse ? b - a : a - b;
    });
  }

  _get_arrays(count = 15) {
    let arrays = [];
    for (let i = 0; i < count; i++) {
      let array = [];
      for (let j = 0; j < 10; j++) {
        array.push(Math.floor(Math.random() * 100));
      }
      arrays.push(array);
    }
    return arrays;
  }

  _generic_test_bubblesort(reverse = false) {
    if (typeof this.previewWindow.bubblesort !== "function") {
      return {
        details_wrong: "Funkcia <code>bubblesort</code> nie je správne definovaná.",
      };
    }

    for (let array of this._get_arrays()) {
      let sorted = this.previewWindow.bubblesort(array.slice(), reverse);
      let correct = this._correct_sort(array.slice(), reverse);

      if (JSON.stringify(sorted) !== JSON.stringify(correct)) {
        return {
          details_wrong: "Funkcia <code>bubblesort</code> nevracia správny výsledok.",
        };
      }
    }

    return {
      score: 1,
      details_ok: "Funkcia <code>bubblesort</code> je správne implementovaná.",
    };
  }

  test_bubblesort_min() {
    return this._generic_test_bubblesort(true);
  }

  test_bubblesort_max() {
    return this._generic_test_bubblesort(false);
  }
}
