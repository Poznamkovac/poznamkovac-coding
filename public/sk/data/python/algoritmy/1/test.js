async function test(context) {
  const pyodide = context.pyodide;
  if (!pyodide) {
    throw new Error("pyodide not found in test context");
  }

  try {
    const testCode = `
import random

# Check if bubble_sort function exists
try:
    from bubble_sort import bubble_sort
except ImportError:
    raise ImportError("Funkcia bubble_sort() nie je definovaná.")

# Run tests
test_passed = True
error_message = ""

for i in range(10):
    test_array = [random.randint(-50, 50) for _ in range(10)]
    expected = sorted(test_array.copy())
    result = bubble_sort(test_array.copy())

    if result != expected:
        test_passed = False
        error_message = f"Test {i+1} zlyhal. Vstup: {test_array[:5]}..., Očakávaný výstup: {expected[:5]}..., Váš výstup: {result[:5] if result else 'None'}..."
        break

(test_passed, error_message)
    `;

    const [passed, errorMessage] = pyodide.runPython(testCode);

    if (passed) {
      return {
        passed: true,
        score: 10,
        feedback: "Výborne! Funkcia bubble_sort() funguje správne pre všetky testovacie prípady.",
      };
    } else {
      return {
        passed: false,
        score: 0,
        feedback: errorMessage || "Funkcia bubble_sort() vrátila nesprávnu hodnotu.",
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
