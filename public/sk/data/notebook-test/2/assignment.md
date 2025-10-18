# Python Data Science Notebook

Learn how to work with NumPy, Pandas, and Matplotlib in this interactive notebook.

## Setup

First, let's import the necessary libraries:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

```

## NumPy Arrays

Create and manipulate NumPy arrays:

```
# Create a NumPy array
arr = np.array([1, 2, 3, 4, 5])
print(f"Array: {arr}")
print(f"Mean: {arr.mean()}")

total = arr.sum()
print(f"Sum: {total}")
arr
```

## Pandas DataFrame

Work with tabular data using Pandas:

```
# Create a DataFrame
df = pd.read_csv('data.csv')
print("DataFrame created:")
df
```

Try filtering the DataFrame:

```
# Filter people with score > 40
high_scorers = df[df['Score'] > 40]
print("High scorers (Score > 40):")
high_scorers
```

## Matplotlib Visualization

Create a simple plot:

```
# Create sample data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot (figsize is set to reasonable defaults)
plt.figure()
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.grid(True)
plt.show()
```

## Summary

You've learned the basics of:

- NumPy arrays and operations
- Pandas DataFrames
- Matplotlib plotting

Try experimenting with different data and visualizations!
