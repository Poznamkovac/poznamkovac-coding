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
    elif len(data) != 25:
        results.append((False, "Data rows", f"Should have 25 rows, got {len(data)}"))
    else:
        results.append((True, "Data loaded correctly", ""))
```

# Test for Cell 2 (Histogram)

```python
import matplotlib.pyplot as plt

results = []

# Check if a plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Histogram creation", "No histogram was created"))
else:
    results.append((True, "Histogram created", ""))
```

# Test for Cell 3 (Boxplot)

```python
results = []

# Check if a plot exists
if len(plt.get_fignums()) == 0:
    results.append((False, "Boxplot creation", "No boxplot was created"))
else:
    results.append((True, "Boxplot created", ""))
```

# Test for Cell 4 (Scatter plot)

```python
results = []

# Check if a plot exists
if len(plt.get_fignums()) == 0:
    results.append((False, "Scatter plot creation", "No scatter plot was created"))
else:
    # Check if z and p are defined (for trend line)
    if 'z' not in dir() or 'p' not in dir():
        results.append((False, "Trend line", "Trend line variables should be defined"))
    else:
        results.append((True, "Scatter plot with trend line", ""))
```

# Test for Cell 5 (Bar chart)

```python
results = []

# Check if region_stats is defined
if 'region_stats' not in dir():
    results.append((False, "Region statistics", "Variable 'region_stats' should be defined"))
else:
    if not isinstance(region_stats, pd.DataFrame):
        results.append((False, "Stats type", "region_stats should be a DataFrame"))
    elif 'mean' not in region_stats.columns or 'std' not in region_stats.columns:
        results.append((False, "Stats columns", "Should have 'mean' and 'std' columns"))
    else:
        results.append((True, "Regional statistics calculated", ""))

# Check if a plot exists
if len(plt.get_fignums()) == 0:
    results.append((False, "Bar chart creation", "No bar chart was created"))
else:
    results.append((True, "Bar chart created", ""))
```

# Test for Cell 6 (Heatmap)

```python
results = []

# Check if correlation_matrix is defined
if 'correlation_matrix' not in dir():
    results.append((False, "Correlation matrix", "Variable 'correlation_matrix' should be defined"))
else:
    if not isinstance(correlation_matrix, pd.DataFrame):
        results.append((False, "Matrix type", "correlation_matrix should be a DataFrame"))
    else:
        # Check if it's a square matrix
        if correlation_matrix.shape[0] != correlation_matrix.shape[1]:
            results.append((False, "Matrix shape", "Correlation matrix should be square"))
        else:
            results.append((True, "Correlation matrix calculated", ""))

        # Check if diagonal values are 1 (correlation with itself)
        import numpy as np
        if not np.allclose(np.diag(correlation_matrix), 1.0):
            results.append((False, "Diagonal values", "Diagonal should be 1"))
        else:
            results.append((True, "Correlation matrix valid", ""))

# Check if heatmap was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Heatmap creation", "No heatmap was created"))
else:
    results.append((True, "Heatmap created", ""))
```
