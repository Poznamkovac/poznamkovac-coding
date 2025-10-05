async function test(context) {
  const pyodide = context.pyodide;
  if (!pyodide) {
    throw new Error("pyodide not found in test context");
  }

  try {
    const testCode = `
# Import the function
try:
    from main import mincovka_greedy
except ImportError:
    raise ImportError("Funkcia mincovka_greedy() nie je definovaná.")

# Test cases
test_cases = [
    ([1, 2, 5, 10, 20, 50, 100], 123, [100, 20, 2, 1]),
    ([3, 1, 2], 10, [3, 3, 3, 1]),
    ([10, 7, 1], 14, [10, 1, 1, 1, 1])  # Greedy test
]

all_passed = True
error_message = ""

for i, (platidla, suma, expected) in enumerate(test_cases):
    result = mincovka_greedy(platidla.copy(), suma)
    if result != expected:
        all_passed = False
        if i == 2 and result == [7, 7]:
            error_message = f"Test {i+1}: Riešenie pre sumu 14 ({result}) je správne, ale nie je vypočítané pomocou pažravého algoritmu."
        else:
            error_message = f"Test {i+1} zlyhal. Platidlá: {platidla}, Suma: {suma}, Očakávané: {expected}, Vaše: {result}"
        break

(all_passed, error_message)
    `;

    const [passed, errorMessage] = pyodide.runPython(testCode);

    if (passed) {
      return {
        passed: true,
        score: 5,
        feedback: "Výborne! Funkcia mincovka_greedy() správne implementuje pažravý algoritmus.",
      };
    } else {
      return {
        passed: false,
        score: 0,
        feedback: errorMessage || "Funkcia mincovka_greedy() vrátila nesprávnu hodnotu.",
      };
    }
  } catch (error) {
    return {
      passed: false,
      score: 0,
      feedback: `Chyba pri testovaní: ${error.message}`,
    };
  }
}
