async function test(context) {
  const pyodide = context.pyodide;
  if (!pyodide) {
    return [
      {
        name: "Inicializácia testovania",
        passed: false,
        error: "Pyodide runtime nie je k dispozícii",
      },
    ];
  }

  try {
    const testCode = `
import random

try:
    from bubble_sort import bubble_sort
except ImportError:
    raise ImportError("Funkcia bubble_sort() nie je definovaná.")

results = []

for i in range(10):
    test_array = [random.randint(-50, 50) for _ in range(10)]
    expected = sorted(test_array.copy())
    result = bubble_sort(test_array.copy())

    if result != expected:
        results.append((False, f"Test {i+1}", f"Vstup: {test_array[:5]}..., Očakávaný: {expected[:5]}..., Váš: {result[:5] if result else 'None'}..."))
        break
    else:
        results.append((True, f"Test {i+1}", ""))

results
    `;

    const results = pyodide.runPython(testCode);

    return results.map(([passed, name, error]) => ({
      name,
      passed,
      error: error || undefined,
    }));
  } catch (error) {
    return [
      {
        name: "Vykonanie testov",
        passed: false,
        error: error.message,
      },
    ];
  }
}
