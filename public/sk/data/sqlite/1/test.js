async function test(context) {
  const sqlite = context.sqlite;
  if (!sqlite || !sqlite.results) {
    return {
      passed: false,
      score: 0,
      feedback: "Žiadne výsledky z databázy. Skontrolujte váš SQL dotaz.",
    };
  }

  const results = sqlite.results;

  if (results.length === 0) {
    return {
      passed: false,
      score: 0,
      feedback: "Váš dotaz nevrátil žiadne výsledky.",
    };
  }

  // Get the first result set (main query result)
  const result = results[0];

  // Expected result: students older than 18, sorted by age descending
  const expectedColumns = ["id", "name", "age"];
  const expectedRows = [
    [3, "Peter", 22],
    [1, "Ján", 20],
    [4, "Eva", 19],
  ];

  // Check columns
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    return {
      passed: false,
      score: 0,
      feedback: `Nesprávne stĺpce. Očakávané: ${expectedColumns.join(", ")}, Vaše: ${result.columns.join(", ")}`,
    };
  }

  // Check number of rows
  if (result.rows.length !== expectedRows.length) {
    return {
      passed: false,
      score: 0,
      feedback: `Nesprávny počet riadkov. Očakávané: ${expectedRows.length}, Vaše: ${result.rows.length}`,
    };
  }

  // Check row values and order
  for (let i = 0; i < expectedRows.length; i++) {
    const expected = expectedRows[i];
    const actual = result.rows[i];

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      // Check if it's just an ordering issue
      const actualSorted = [...result.rows].sort((a, b) => b[2] - a[2]); // Sort by age desc
      if (JSON.stringify(actualSorted) === JSON.stringify(expectedRows)) {
        return {
          passed: false,
          score: 5,
          feedback: "Správne študenti, ale nesprávne zoradenie. Použite ORDER BY age DESC.",
        };
      }

      return {
        passed: false,
        score: 0,
        feedback: `Nesprávny riadok ${i + 1}. Očakávané: ${expected.join(", ")}, Vaše: ${actual ? actual.join(", ") : "undefined"}`,
      };
    }
  }

  // All checks passed
  return {
    passed: true,
    score: 10,
    feedback: "Výborne! Váš SQL dotaz vracia správne výsledky - študentov starších ako 18 rokov, zoradených podľa veku zostupne.",
  };
}
