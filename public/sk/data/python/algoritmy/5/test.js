async function test(context) {
  const pyodide = context.pyodide;
  if (!pyodide) {
    throw new Error("pyodide not found in test context");
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

# Check if memoization is working
test_passed = True
error_message = ""

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
        test_passed = False
        error_message = f"Hodnota dp[{n}] nie je v slovníku dp. Používate memoizáciu?"
        break
    if dp[n] != expected:
        test_passed = False
        error_message = f"Nesprávna hodnota dp[{n}]. Očakávané: {expected}, Vaše: {dp[n]}"
        break

# Check that fibonacci(20) returns correct value
if test_passed and result != 6765:
    test_passed = False
    error_message = f"fibonacci(20) vrátilo {result}, očakávané: 6765"

(test_passed, error_message)
    `;

    const [passed, errorMessage] = pyodide.runPython(testCode);

    if (passed) {
      return {
        passed: true,
        score: 5,
        feedback: "Výborne! Funkcia fibonacci() správne používa memoizáciu a ukladá medzivýsledky do slovníka dp.",
      };
    } else {
      return {
        passed: false,
        score: 0,
        feedback: errorMessage || "Premenná dp obsahuje nesprávne hodnoty alebo funkcia nepoužíva memoizáciu.",
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
