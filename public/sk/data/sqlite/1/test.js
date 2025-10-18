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
  let orderCorrect = true;
  for (let i = 0; i < expectedRows.length; i++) {
    const expected = expectedRows[i];
    const actual = result.rows[i];

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      orderCorrect = false;
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
