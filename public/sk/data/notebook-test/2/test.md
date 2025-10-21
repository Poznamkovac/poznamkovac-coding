# Test for Cell 1 (Load CSV)

```python
import pandas as pd

results = []

# Check if data is defined
if 'data' not in dir():
    results.append((False, "CSV loading", "Variable 'data' should be defined"))
else:
    # Check if it's a DataFrame
    if not isinstance(data, pd.DataFrame):
        results.append((False, "Data type", "data should be a pandas DataFrame"))
    else:
        # Check if it has correct number of rows and columns
        if data.shape != (10, 5):
            results.append((False, "Data shape", f"DataFrame should have shape (10, 5), got {data.shape}"))
        else:
            results.append((True, "CSV loaded correctly", ""))
```

# Test for Cell 2 (Basic info)

```python
results = []

# Check if summary is defined
if 'summary' not in dir():
    results.append((False, "Summary statistics", "Variable 'summary' should be defined"))
else:
    if not isinstance(summary, pd.DataFrame):
        results.append((False, "Summary type", "summary should be a DataFrame"))
    else:
        results.append((True, "Summary statistics created", ""))
```

# Test for Cell 3 (Missing values)

```python
results = []

# Check if missing_values is defined
if 'missing_values' not in dir():
    results.append((False, "Missing values check", "Variable 'missing_values' should be defined"))
else:
    # Check if data_clean is defined
    if 'data_clean' not in dir():
        results.append((False, "Clean data", "Variable 'data_clean' should be defined"))
    else:
        # Check if it has no missing values
        if data_clean.isnull().sum().sum() != 0:
            results.append((False, "Data cleaning", "data_clean should have no missing values"))
        else:
            results.append((True, "Missing values handled", ""))

        # Should have 8 rows after removing missing values
        if len(data_clean) != 8:
            results.append((False, "Rows after cleaning", f"Should have 8 rows, got {len(data_clean)}"))
        else:
            results.append((True, "Correct number of rows", ""))
```

# Test for Cell 4 (New columns)

```python
results = []

# Check if average_score column exists
if 'average_score' not in data_clean.columns:
    results.append((False, "Average score column", "Column 'average_score' should exist"))
else:
    # Check if average is calculated correctly
    expected_avg = data_clean[['Math', 'Physics', 'Chemistry']].mean(axis=1)
    if not data_clean['average_score'].equals(expected_avg):
        results.append((False, "Average calculation", "average_score should be mean of Math, Physics, Chemistry"))
    else:
        results.append((True, "Average score calculated", ""))

# Check if performance column exists
if 'performance' not in data_clean.columns:
    results.append((False, "Performance column", "Column 'performance' should exist"))
else:
    # Check if performance has correct categories
    unique_perf = set(data_clean['performance'].dropna().unique())
    expected_categories = {'Nedostatočný', 'Dobrý', 'Výborný'}
    if not unique_perf.issubset(expected_categories):
        results.append((False, "Performance categories", f"Unexpected categories: {unique_perf - expected_categories}"))
    else:
        results.append((True, "Performance categories created", ""))
```
