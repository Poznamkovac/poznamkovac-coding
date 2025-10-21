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
    elif len(data) != 60:
        results.append((False, "Data rows", f"Should have 60 rows, got {len(data)}"))
    else:
        results.append((True, "Data loaded correctly", ""))
```

# Test for Cell 2 (Outlier detection)

```python
results = []

# Check if outliers_count is defined
if 'outliers_count' not in dir():
    results.append((False, "Outlier count", "Variable 'outliers_count' should be defined"))
else:
    # Should detect at least 1 outlier
    if outliers_count < 1:
        results.append((False, "Outliers detected", "Should detect at least 1 outlier"))
    else:
        results.append((True, "Outliers detected using IQR", ""))

# Check if plot was created
import matplotlib.pyplot as plt
if len(plt.get_fignums()) == 0:
    results.append((False, "Outlier visualization", "No plot was created"))
else:
    results.append((True, "Outlier visualization created", ""))
```

# Test for Cell 3 (Linear regression and residuals)

```python
results = []

# Check if residuals are defined
if 'residuals' not in dir():
    results.append((False, "Residuals", "Variable 'residuals' should be defined"))
else:
    # Check if residuals_std is defined
    if 'residuals_std' not in dir():
        results.append((False, "Residuals std", "Variable 'residuals_std' should be defined"))
    else:
        if residuals_std <= 0:
            results.append((False, "Residuals std value", "Standard deviation should be positive"))
        else:
            results.append((True, "Residuals calculated", ""))

# Check if y_pred is defined
if 'y_pred' not in dir():
    results.append((False, "Predictions", "Variable 'y_pred' should be defined"))
else:
    results.append((True, "Predictions calculated", ""))

# Check if plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Residual plot", "No residual plot was created"))
else:
    results.append((True, "Residual plot created", ""))
```

# Test for Cell 4 (Normality test)

```python
results = []

# Check if normality test was performed
if 'normality_p_value' not in dir():
    results.append((False, "Normality test", "Variable 'normality_p_value' should be defined"))
else:
    # P-value should be between 0 and 1
    if normality_p_value < 0 or normality_p_value > 1:
        results.append((False, "P-value range", "P-value should be between 0 and 1"))
    else:
        results.append((True, "Normality test performed", ""))

# Check if Q-Q plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Q-Q plot", "No Q-Q plot was created"))
else:
    results.append((True, "Q-Q plot created", ""))
```

# Test for Cell 5 (Data transformation)

```python
import numpy as np

results = []

# Check if transformed_data is defined
if 'transformed_data' not in dir():
    results.append((False, "Transformed data", "Variable 'transformed_data' should be defined"))
else:
    if not isinstance(transformed_data, pd.DataFrame):
        results.append((False, "Transformed data type", "transformed_data should be a DataFrame"))
    else:
        # Check for required columns
        required_cols = ['Measurement', 'measurement_standardized', 'measurement_normalized']
        if not all(col in transformed_data.columns for col in required_cols):
            results.append((False, "Transformation columns", f"Should have columns: {required_cols}"))
        else:
            results.append((True, "All transformations present", ""))

            # Check standardization (mean ≈ 0, std ≈ 1)
            std_mean = transformed_data['measurement_standardized'].mean()
            std_std = transformed_data['measurement_standardized'].std()
            if abs(std_mean) > 0.01:
                results.append((False, "Standardization mean", f"Mean should be ≈0, got {std_mean:.4f}"))
            else:
                results.append((True, "Standardization mean correct", ""))

            if abs(std_std - 1.0) > 0.01:
                results.append((False, "Standardization std", f"Std should be ≈1, got {std_std:.4f}"))
            else:
                results.append((True, "Standardization std correct", ""))

            # Check normalization (min = 0, max = 1)
            norm_min = transformed_data['measurement_normalized'].min()
            norm_max = transformed_data['measurement_normalized'].max()
            if abs(norm_min) > 0.01 or abs(norm_max - 1.0) > 0.01:
                results.append((False, "Normalization range", f"Should be [0, 1], got [{norm_min:.2f}, {norm_max:.2f}]"))
            else:
                results.append((True, "Normalization range correct", ""))

# Check if visualization was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Transformation visualization", "No plot was created"))
else:
    results.append((True, "Transformation visualization created", ""))
```
