export default class HTMLChallengeTester {
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

  /** @param {Window} window */
  _generic_test_bubblesort(window, reverse = false) {
    if (typeof window.bubblesort !== "function") {
      return {
        detaily_zle: "Funkcia <code>bubblesort</code> nie je správne definovaná.",
      };
    }

    for (let array of this._get_arrays()) {
      let sorted = window.bubblesort(array.slice(), reverse);
      let correct = this._correct_sort(array.slice(), reverse);

      if (JSON.stringify(sorted) !== JSON.stringify(correct)) {
        return {
          detaily_zle: "Funkcia <code>bubblesort</code> nevracia správny výsledok.",
        };
      }
    }

    return {
      skore: 1,
      detaily_ok: "Funkcia <code>bubblesort</code> je správne implementovaná.",
    };
  }

  /** @param {Window} window */
  test_bubblesort_min(window) {
    return this._generic_test_bubblesort(window, true);
  }

  /** @param {Window} window */
  test_bubblesort_max(window) {
    return this._generic_test_bubblesort(window, false);
  }
}
