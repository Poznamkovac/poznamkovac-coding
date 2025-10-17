# Test for Cell 1 (Create NumPy array)

```python
import numpy as np

results = []

# Check if arr is defined
if 'arr' not in dir():
    results.append((False, "Array creation", "Variable 'arr' should be defined"))
else:
    # Check if it's the correct array
    expected_arr = np.array([1, 2, 3, 4, 5])
    if not isinstance(arr, np.ndarray):
        results.append((False, "Array type", "arr should be a NumPy array"))
    elif not np.array_equal(arr, expected_arr):
        results.append((False, "Array values", f"arr should be [1, 2, 3, 4, 5], got {arr.tolist()}"))
    else:
        results.append((True, "Array creation and values", ""))

# Check if total variable is defined
if 'total' not in dir():
    results.append((False, "Sum calculation", "Variable 'total' should be defined"))
elif total != 15:
    results.append((False, "Sum calculation", f"total should be 15, got {total}"))
else:
    results.append((True, "Sum calculation", ""))
```

# Test for Cell 2 (Create Pandas DataFrame)

```python
import pandas as pd

results = []

# Check if df is defined
if 'df' not in dir():
    results.append((False, "DataFrame creation", "Variable 'df' should be defined"))
else:
    # Check if it's a DataFrame
    if not isinstance(df, pd.DataFrame):
        results.append((False, "DataFrame type", "df should be a Pandas DataFrame"))
    else:
        # Check columns
        expected_columns = ['Name', 'Age', 'Score']
        if list(df.columns) != expected_columns:
            results.append((False, "DataFrame columns", f"Columns should be {expected_columns}, got {list(df.columns)}"))
        else:
            results.append((True, "DataFrame columns", ""))

        # Check number of rows
        if len(df) != 4:
            results.append((False, "DataFrame rows", f"Should have 4 rows, got {len(df)}"))
        else:
            results.append((True, "DataFrame rows", ""))
```

# Test for Cell 3 (Filter DataFrame)

```python
results = []

# Check if high_scorers is defined
if 'high_scorers' not in dir():
    results.append((False, "Filtered DataFrame", "Variable 'high_scorers' should be defined"))
else:
    # Check if filtering is correct
    if not isinstance(high_scorers, pd.DataFrame):
        results.append((False, "Filtered DataFrame type", "high_scorers should be a DataFrame"))
    else:
        # Should have 3 people with score > 80: Alice (85), Bob (92), David (95)
        if len(high_scorers) != 3:
            results.append((False, "Filter result count", f"Should have 3 high scorers, got {len(high_scorers)}"))
        else:
            results.append((True, "Filter result count", ""))

        # Check all scores are > 80
        if not all(high_scorers['Score'] > 80):
            results.append((False, "Filter condition", "All scores should be > 80"))
        else:
            results.append((True, "Filter condition", ""))
```

# Test for Cell 4 (Matplotlib plot)

```python
import matplotlib.pyplot as plt

results = []

# Check if x and y variables are defined
if 'x' not in dir() or 'y' not in dir():
    results.append((False, "Plot data", "Variables 'x' and 'y' should be defined"))
else:
    # Check if x is linspace from 0 to 10
    if len(x) < 50:
        results.append((False, "X data", f"x should have at least 50 points, got {len(x)}"))
    else:
        results.append((True, "X data points", ""))

    # Check if y is sine of x
    expected_y = np.sin(x)
    if not np.allclose(y, expected_y, rtol=0.01):
        results.append((False, "Y data", "y should be sin(x)"))
    else:
        results.append((True, "Y data (sine wave)", ""))

# Check if a plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Plot creation", "No plot was created"))
else:
    results.append((True, "Plot creation", ""))
```
