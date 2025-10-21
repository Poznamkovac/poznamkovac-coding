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

# Test for Cell 2 (Correlation analysis)

```python
results = []

# Check if correlation_matrix is defined
if 'correlation_matrix' not in dir():
    results.append((False, "Correlation matrix", "Variable 'correlation_matrix' should be defined"))
else:
    if not isinstance(correlation_matrix, pd.DataFrame):
        results.append((False, "Matrix type", "correlation_matrix should be a DataFrame"))
    else:
        # Check if it's a square matrix with 5x5 dimensions
        if correlation_matrix.shape != (5, 5):
            results.append((False, "Matrix shape", f"Should be 5x5, got {correlation_matrix.shape}"))
        else:
            results.append((True, "Correlation matrix calculated", ""))

        # Check if diagonal values are 1
        import numpy as np
        if not np.allclose(np.diag(correlation_matrix), 1.0):
            results.append((False, "Diagonal values", "Diagonal should be 1"))
        else:
            results.append((True, "Correlation matrix valid", ""))

# Check if plot was created
import matplotlib.pyplot as plt
if len(plt.get_fignums()) == 0:
    results.append((False, "Correlation heatmap", "No heatmap was created"))
else:
    results.append((True, "Correlation heatmap created", ""))
```

# Test for Cell 3 (PCA)

```python
results = []

# Check if pca_variance_2d is defined
if 'pca_variance_2d' not in dir():
    results.append((False, "PCA variance", "Variable 'pca_variance_2d' should be defined"))
else:
    # Should be between 0 and 1
    if pca_variance_2d < 0 or pca_variance_2d > 1:
        results.append((False, "Variance range", "Cumulative variance should be between 0 and 1"))
    else:
        results.append((True, "PCA variance calculated", ""))

# Check if pca_df is defined
if 'pca_df' not in dir():
    results.append((False, "PCA DataFrame", "Variable 'pca_df' should be defined"))
else:
    if not isinstance(pca_df, pd.DataFrame):
        results.append((False, "PCA df type", "pca_df should be a DataFrame"))
    elif 'PC1' not in pca_df.columns or 'PC2' not in pca_df.columns:
        results.append((False, "PCA columns", "Should have PC1 and PC2 columns"))
    else:
        results.append((True, "PCA components created", ""))

# Check if plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "PCA variance plot", "No variance plot was created"))
else:
    results.append((True, "PCA variance plot created", ""))
```

# Test for Cell 4 (PCA visualization)

```python
results = []

# Check if scatter plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "PCA scatter plot", "No scatter plot was created"))
else:
    results.append((True, "PCA scatter plot created", ""))
```

# Test for Cell 5 (K-means clustering)

```python
results = []

# Check if cluster column was added
if 'Cluster' not in data.columns:
    results.append((False, "Cluster column", "Column 'Cluster' should be added to data"))
else:
    # Check number of unique clusters
    n_unique_clusters = data['Cluster'].nunique()
    if n_unique_clusters != 3:
        results.append((False, "Number of clusters", f"Should have 3 clusters, got {n_unique_clusters}"))
    else:
        results.append((True, "K-means clustering performed", ""))

# Check if cluster_counts is defined
if 'cluster_counts' not in dir():
    results.append((False, "Cluster counts", "Variable 'cluster_counts' should be defined"))
else:
    if len(cluster_counts) != 3:
        results.append((False, "Cluster count values", f"Should have 3 values, got {len(cluster_counts)}"))
    else:
        results.append((True, "Cluster counts calculated", ""))

# Check if plot was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Cluster visualization", "No cluster plot was created"))
else:
    results.append((True, "Cluster visualization created", ""))
```

# Test for Cell 6 (Hierarchical clustering)

```python
results = []

# Check if dendrogram was created
if len(plt.get_fignums()) == 0:
    results.append((False, "Dendrogram", "No dendrogram was created"))
else:
    results.append((True, "Dendrogram created", ""))

# Check if linkage_matrix is defined
if 'linkage_matrix' not in dir():
    results.append((False, "Linkage matrix", "Variable 'linkage_matrix' should be defined"))
else:
    results.append((True, "Hierarchical clustering performed", ""))
```
