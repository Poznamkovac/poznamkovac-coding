import matplotlib
matplotlib.use('module://matplotlib_pyodide.html5_canvas_backend')
import matplotlib.pyplot as plt
import numpy as np

# Vytvorte dáta
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Vytvorte graf
plt.figure(figsize=(10, 6))
plt.plot(x, y1, label='sin(x)', color='blue')
plt.plot(x, y2, label='cos(x)', color='red')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Sínusová a kosínusová funkcia')
plt.legend()
plt.grid(True)
plt.show()
