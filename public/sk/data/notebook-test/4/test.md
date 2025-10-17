# Test for Cell 1 (Basic SELECT - all students)

```javascript
async function test(context) {
  const results = [];
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results || sqlite.results.length === 0) {
    results.push({
      name: "Query execution",
      passed: false,
      error: "No query results found"
    });
    return results;
  }

  const result = sqlite.results[0];

  // Check if we got columns
  if (!result.columns || result.columns.length === 0) {
    results.push({
      name: "Query columns",
      passed: false,
      error: "No columns returned"
    });
    return results;
  }

  // Check for expected columns (should have all columns from students table)
  const expectedColumns = ['id', 'name', 'age', 'grade', 'major'];
  const hasAllColumns = expectedColumns.every(col => result.columns.includes(col));

  if (!hasAllColumns) {
    results.push({
      name: "Column check",
      passed: false,
      error: `Expected columns: ${expectedColumns.join(', ')}, got: ${result.columns.join(', ')}`
    });
  } else {
    results.push({
      name: "Column check",
      passed: true
    });
  }

  // Check number of rows (should be 5 students)
  if (result.rows.length !== 5) {
    results.push({
      name: "Row count",
      passed: false,
      error: `Expected 5 students, got ${result.rows.length}`
    });
  } else {
    results.push({
      name: "Row count",
      passed: true
    });
  }

  return results;
}
```

# Test for Cell 2 (Filtering - grade > 3.7)

```javascript
async function test(context) {
  const results = [];
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results || sqlite.results.length === 0) {
    results.push({
      name: "Query execution",
      passed: false,
      error: "No query results found"
    });
    return results;
  }

  const result = sqlite.results[0];

  // Check columns
  const expectedColumns = ['name', 'grade', 'major'];
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    results.push({
      name: "Column check",
      passed: false,
      error: `Expected columns: ${expectedColumns.join(', ')}, got: ${result.columns.join(', ')}`
    });
  } else {
    results.push({
      name: "Column check",
      passed: true
    });
  }

  // Check number of rows (should be 2: Charlie 3.9, Alice 3.8)
  if (result.rows.length !== 2) {
    results.push({
      name: "Filtered row count",
      passed: false,
      error: `Expected 2 students with grade > 3.7, got ${result.rows.length}`
    });
  } else {
    results.push({
      name: "Filtered row count",
      passed: true
    });
  }

  // Check if all grades are > 3.7
  const gradeIndex = result.columns.indexOf('grade');
  const allAbove37 = result.rows.every(row => row[gradeIndex] > 3.7);

  if (!allAbove37) {
    results.push({
      name: "Grade filter condition",
      passed: false,
      error: "Not all returned students have grade > 3.7"
    });
  } else {
    results.push({
      name: "Grade filter condition",
      passed: true
    });
  }

  // Check ordering (should be DESC by grade)
  if (result.rows.length >= 2) {
    const grades = result.rows.map(row => row[gradeIndex]);
    const isSorted = grades.every((grade, i) => i === 0 || grades[i - 1] >= grade);

    if (!isSorted) {
      results.push({
        name: "ORDER BY grade DESC",
        passed: false,
        error: "Results are not ordered by grade in descending order"
      });
    } else {
      results.push({
        name: "ORDER BY grade DESC",
        passed: true
      });
    }
  }

  return results;
}
```

# Test for Cell 3 (Aggregation - GROUP BY major)

```javascript
async function test(context) {
  const results = [];
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results || sqlite.results.length === 0) {
    results.push({
      name: "Query execution",
      passed: false,
      error: "No query results found"
    });
    return results;
  }

  const result = sqlite.results[0];

  // Check columns
  const expectedColumns = ['major', 'student_count', 'avg_grade'];
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    results.push({
      name: "Column check",
      passed: false,
      error: `Expected columns: ${expectedColumns.join(', ')}, got: ${result.columns.join(', ')}`
    });
  } else {
    results.push({
      name: "Column check",
      passed: true
    });
  }

  // Check number of groups (should be 3: CS, Math, Physics)
  if (result.rows.length !== 3) {
    results.push({
      name: "GROUP BY result count",
      passed: false,
      error: `Expected 3 major groups, got ${result.rows.length}`
    });
  } else {
    results.push({
      name: "GROUP BY result count",
      passed: true
    });
  }

  // Check if COUNT is used correctly
  const countIndex = result.columns.indexOf('student_count');
  const majorIndex = result.columns.indexOf('major');

  // Computer Science and Mathematics should have 2 students each
  const csRow = result.rows.find(row => row[majorIndex] === 'Computer Science');
  const mathRow = result.rows.find(row => row[majorIndex] === 'Mathematics');

  if (csRow && csRow[countIndex] === 2 && mathRow && mathRow[countIndex] === 2) {
    results.push({
      name: "COUNT aggregation",
      passed: true
    });
  } else {
    results.push({
      name: "COUNT aggregation",
      passed: false,
      error: "COUNT aggregation is not correct"
    });
  }

  return results;
}
```

# Test for Cell 4 (Advanced Query - CS students with grade >= 3.7)

```javascript
async function test(context) {
  const results = [];
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results || sqlite.results.length === 0) {
    results.push({
      name: "Query execution",
      passed: false,
      error: "No query results found"
    });
    return results;
  }

  const result = sqlite.results[0];

  // Check columns
  const expectedColumns = ['name', 'age', 'grade'];
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    results.push({
      name: "Column check",
      passed: false,
      error: `Expected columns: ${expectedColumns.join(', ')}, got: ${result.columns.join(', ')}`
    });
  } else {
    results.push({
      name: "Column check",
      passed: true
    });
  }

  // Should return 2 students: Alice (3.8) and Diana (3.7) - but Diana has 3.7 which is >= 3.7
  if (result.rows.length !== 2) {
    results.push({
      name: "Filtered row count",
      passed: false,
      error: `Expected 2 CS students with grade >= 3.7, got ${result.rows.length}`
    });
  } else {
    results.push({
      name: "Filtered row count",
      passed: true
    });
  }

  // Check if grades are >= 3.7
  const gradeIndex = result.columns.indexOf('grade');
  const allAbove37 = result.rows.every(row => row[gradeIndex] >= 3.7);

  if (!allAbove37) {
    results.push({
      name: "Grade filter (>= 3.7)",
      passed: false,
      error: "Not all students have grade >= 3.7"
    });
  } else {
    results.push({
      name: "Grade filter (>= 3.7)",
      passed: true
    });
  }

  return results;
}
```

# Test for Cell 5 (Statistics)

```javascript
async function test(context) {
  const results = [];
  const sqlite = context.sqlite;

  if (!sqlite || !sqlite.results || sqlite.results.length === 0) {
    results.push({
      name: "Query execution",
      passed: false,
      error: "No query results found"
    });
    return results;
  }

  const result = sqlite.results[0];

  // Check columns
  const expectedColumns = ['total_students', 'average_age', 'average_grade', 'lowest_grade', 'highest_grade'];
  if (JSON.stringify(result.columns) !== JSON.stringify(expectedColumns)) {
    results.push({
      name: "Column check",
      passed: false,
      error: `Expected columns: ${expectedColumns.join(', ')}, got: ${result.columns.join(', ')}`
    });
  } else {
    results.push({
      name: "Column check",
      passed: true
    });
  }

  // Should return 1 row with statistics
  if (result.rows.length !== 1) {
    results.push({
      name: "Result row count",
      passed: false,
      error: `Expected 1 row of statistics, got ${result.rows.length}`
    });
    return results;
  }

  const stats = result.rows[0];
  const totalIndex = result.columns.indexOf('total_students');
  const minIndex = result.columns.indexOf('lowest_grade');
  const maxIndex = result.columns.indexOf('highest_grade');

  // Check total students
  if (stats[totalIndex] !== 5) {
    results.push({
      name: "COUNT(*) - total students",
      passed: false,
      error: `Expected 5 total students, got ${stats[totalIndex]}`
    });
  } else {
    results.push({
      name: "COUNT(*) - total students",
      passed: true
    });
  }

  // Check MIN and MAX
  if (stats[minIndex] !== 3.5) {
    results.push({
      name: "MIN(grade)",
      passed: false,
      error: `Expected lowest grade 3.5, got ${stats[minIndex]}`
    });
  } else {
    results.push({
      name: "MIN(grade)",
      passed: true
    });
  }

  if (stats[maxIndex] !== 3.9) {
    results.push({
      name: "MAX(grade)",
      passed: false,
      error: `Expected highest grade 3.9, got ${stats[maxIndex]}`
    });
  } else {
    results.push({
      name: "MAX(grade)",
      passed: true
    });
  }

  return results;
}
```
