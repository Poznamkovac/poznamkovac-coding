async function test(context) {
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results) {
    return [
      {
        name: "Kontrola výsledkov databázy",
        passed: false,
        error: "Žiadne výsledky z databázy. Skontrolujte váš SQL dotaz.",
      },
    ];
  }

  const results = sqlite.results;

  if (results.length === 0) {
    return [
      {
        name: "Kontrola výsledkov dotazu",
        passed: false,
        error: "Váš dotaz nevrátil žiadne výsledky.",
      },
    ];
  }

  const result = results[0];
  const expectedColumns = ["id", "name", "age"];
  const expectedRows = [
    [3, "Peter", 22],
    [1, "Ján", 20],
    [4, "Eva", 19],
  ];

  const testCases = [];

  // Test 1: Check columns
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    testCases.push({
      name: "Kontrola stĺpcov",
      passed: false,
      error: `Nesprávne stĺpce. Očakávané: ${expectedColumns.join(", ")}, Vaše: ${result.columns.join(", ")}`,
    });
  } else {
    testCases.push({
      name: "Kontrola stĺpcov",
      passed: true,
    });
  }

  // Test 2: Check number of rows
  if (result.rows.length !== expectedRows.length) {
    testCases.push({
      name: "Kontrola počtu riadkov",
      passed: false,
      error: `Nesprávny počet riadkov. Očakávané: ${expectedRows.length}, Vaše: ${result.rows.length}`,
    });
    return testCases;
  } else {
    testCases.push({
      name: "Kontrola počtu riadkov",
      passed: true,
    });
  }

  // Test 3: Check row values and order
  let orderCorrect = true;
  for (let i = 0; i < expectedRows.length; i++) {
    const expected = expectedRows[i];
    const actual = result.rows[i];

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      orderCorrect = false;
      // Check if it's just an ordering issue
      const actualSorted = [...result.rows].sort((a, b) => b[2] - a[2]);
      if (JSON.stringify(actualSorted) === JSON.stringify(expectedRows)) {
        testCases.push({
          name: "Kontrola zoradenia",
          passed: false,
          error: "Správne študenti, ale nesprávne zoradenie. Použite ORDER BY age DESC.",
        });
      } else {
        testCases.push({
          name: "Kontrola hodnôt riadkov",
          passed: false,
          error: `Nesprávny riadok ${i + 1}. Očakávané: ${expected.join(", ")}, Vaše: ${actual ? actual.join(", ") : "undefined"}`,
        });
      }
      break;
    }
  }

  if (orderCorrect) {
    testCases.push({
      name: "Kontrola hodnôt a zoradenia",
      passed: true,
    });
  }

  return testCases;
}
