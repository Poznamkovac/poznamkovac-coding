# Test for Cell 1 (Load data)

```python
import pandas as pd

results = []

# Check if data is defined
if 'data' not in dir():
    results.append((False, "Data loading", "Variable 'data' should be defined"))
else:
    if not isinstance(data, pd.DataFrame):
        results.append((False, "Data type", "data should be a DataFrame"))
    elif len(data) != 30:
        results.append((False, "Data rows", f"Should have 30 rows, got {len(data)}"))
    else:
        results.append((True, "Data loaded correctly", ""))
```

# Test for Cell 2 (Frequencies)

```python
results = []

# Check if category_counts is defined
if 'category_counts' not in dir():
    results.append((False, "Category counts", "Variable 'category_counts' should be defined"))
else:
    # Check if it's a Series
    if not isinstance(category_counts, pd.Series):
        results.append((False, "Counts type", "category_counts should be a Series"))
    else:
        # Check if all categories are present
        if len(category_counts) != 3:
            results.append((False, "Categories count", f"Should have 3 categories, got {len(category_counts)}"))
        else:
            results.append((True, "Category counts calculated", ""))

# Check if category_freq is defined
if 'category_freq' not in dir():
    results.append((False, "Frequencies", "Variable 'category_freq' should be defined"))
else:
    results.append((True, "Relative frequencies calculated", ""))
```

# Test for Cell 3 (Central tendency)

```python
import numpy as np

results = []

# Check if central_tendency dict exists
if 'central_tendency' not in dir():
    results.append((False, "Central tendency", "Variable 'central_tendency' should be defined"))
else:
    # Check if it has required keys
    required_keys = {'mean', 'median', 'mode'}
    if not required_keys.issubset(central_tendency.keys()):
        results.append((False, "Central tendency keys", f"Should have keys: {required_keys}"))
    else:
        # Check if mean is reasonable
        if abs(central_tendency['mean'] - 53.8) > 2:
            results.append((False, "Mean value", f"Mean should be around 53.8, got {central_tendency['mean']:.2f}"))
        else:
            results.append((True, "Mean calculated correctly", ""))

        # Check if median is reasonable
        if abs(central_tendency['median'] - 53.75) > 2:
            results.append((False, "Median value", f"Median should be around 53.75, got {central_tendency['median']:.2f}"))
        else:
            results.append((True, "Median calculated correctly", ""))
```

# Test for Cell 4 (Variability)

```python
results = []

# Check if variability dict exists
if 'variability' not in dir():
    results.append((False, "Variability measures", "Variable 'variability' should be defined"))
else:
    # Check if it has required keys
    required_keys = {'variance', 'std', 'iqr'}
    if not required_keys.issubset(variability.keys()):
        results.append((False, "Variability keys", f"Should have keys: {required_keys}"))
    else:
        # Check if std is positive
        if variability['std'] <= 0:
            results.append((False, "Standard deviation", "Standard deviation should be positive"))
        else:
            results.append((True, "Standard deviation calculated", ""))

        # Check if IQR is reasonable
        if variability['iqr'] <= 0 or variability['iqr'] > 20:
            results.append((False, "IQR value", f"IQR should be reasonable, got {variability['iqr']:.2f}"))
        else:
            results.append((True, "IQR calculated correctly", ""))
```

# Test for Cell 5 (Grouped statistics)

```python
results = []

# Check if grouped_stats exists
if 'grouped_stats' not in dir():
    results.append((False, "Grouped statistics", "Variable 'grouped_stats' should be defined"))
else:
    if not isinstance(grouped_stats, pd.DataFrame):
        results.append((False, "Grouped stats type", "grouped_stats should be a DataFrame"))
    elif len(grouped_stats) != 3:
        results.append((False, "Groups count", f"Should have 3 groups, got {len(grouped_stats)}"))
    else:
        results.append((True, "Grouped statistics calculated", ""))
```
