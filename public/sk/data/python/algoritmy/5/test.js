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
# Import the function and dp dictionary
try:
    from fibonacci_dp import fibonacci, dp
except ImportError:
    raise ImportError("Funkcia fibonacci() alebo premenná dp nie je definovaná.")

# Run fibonacci to populate dp
result = fibonacci(20)

results = []

# Check specific values in dp
expected_values = {
    0: 0,
    1: 1,
    5: 5,
    10: 55,
    15: 610,
    20: 6765
}

for n, expected in expected_values.items():
    if n not in dp:
        results.append((False, f"Kontrola dp[{n}]", f"Hodnota dp[{n}] nie je v slovníku dp. Používate memoizáciu?"))
        break
    if dp[n] != expected:
        results.append((False, f"Kontrola dp[{n}]", f"Nesprávna hodnota. Očakávané: {expected}, Vaše: {dp[n]}"))
        break
    results.append((True, f"Kontrola dp[{n}]", ""))

# Check that fibonacci(20) returns correct value
if result != 6765:
    results.append((False, "fibonacci(20)", f"Vrátilo {result}, očakávané: 6765"))
else:
    results.append((True, "fibonacci(20)", ""))

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
