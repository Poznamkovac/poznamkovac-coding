from t_bubble_sort import t_bubble_sort
from matplotlib import pyplot as plt
import numpy as np
import random

sizes = np.arange(10, 200, 20)

for _ in range(10):
    operations = []

    for size in sizes:
        random_array = [random.randint(1, 1000) for _ in range(size)]
        ops = t_bubble_sort(random_array)
        operations.append(ops)

    plt.plot(sizes, operations, "rx-", linewidth=0.5, alpha=0.7)

n_squared = [size**2 for size in sizes]
plt.plot(sizes, n_squared, "b-", linewidth=2, label="n²")

plt.xlabel("Array Size (n)")
plt.ylabel("Number of Operations")
plt.title("Bubble Sort Operations vs Array Size")
plt.legend()
plt.grid(True, linestyle="--", alpha=0.7)
plt.show()
