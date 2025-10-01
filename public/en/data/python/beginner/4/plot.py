import matplotlib.pyplot as plt
import numpy as np

# Create data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create plot
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(x, y1, label='sin(x)', color='blue')
ax.plot(x, y2, label='cos(x)', color='red')
ax.set_xlabel('x')
ax.set_ylabel('y')
ax.set_title('Sine and Cosine Functions')
ax.legend()
ax.grid(True)
plt.show()
