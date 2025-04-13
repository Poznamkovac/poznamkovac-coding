/**
 * @param {number[]} array Pole čísiel
 * @param {boolean} [reverse] Režim (false = vzostupný, true = zostupný)
 * @returns {number[]} Usporiadané pole čísiel
 */
function bubblesort(array, reverse = false) {
  const pole = array.slice(); // vytvorenie kópie poľa
  const n = pole.length;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (reverse) {
        if (pole[j] < pole[j + 1]) {
          const pomocna = pole[j];
          pole[j] = pole[j + 1];
          pole[j + 1] = pomocna;
        }
      } else {
        if (pole[j] > pole[j + 1]) {
          const pomocna = pole[j];
          pole[j] = pole[j + 1];
          pole[j + 1] = pomocna;
        }
      }
    }
  }

  return pole;
}
