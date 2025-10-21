# Úvod do dátovej analýzy prostredníctvom modulu pandas

Naučte sa pracovať s knižnicami NumPy, Pandas a Matplotlib v tomto interaktívnom notebooku.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
```

## NumPy polia

Vytvorte a manipulujte s NumPy poľami:

```
# Vytvorte NumPy pole
arr = np.array([1, 2, 3, 4, 5])
print(f"Pole: {arr}")
print(f"Priemer: {arr.mean()}")

total = arr.sum()
print(f"Súčet: {total}")
arr
```

## Pandas DataFrame

Pracujte s tabuľkovými dátami pomocou Pandas:

```
# Vytvorte DataFrame
df = pd.read_csv('data.csv')
print("DataFrame vytvorený:")
df
```

Vyskúšajte filtrovanie DataFrame:

```
# Filtrujte ľudí so skóre > 40
high_scorers = df[df['Score'] > 40]
print("Vysoké skóre (Score > 40):")
high_scorers
```

## Matplotlib vizualizácia

Vytvorte jednoduchý graf:

```
# Vytvorte vzorové dáta
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Vytvorte graf
plt.figure()
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sínusová vlna')
plt.xlabel('Os X')
plt.ylabel('Os Y')
plt.grid(True)
plt.show()
```

## Zhrnutie

Naučili ste sa základy:

- NumPy polí a operácií
- Pandas DataFrames
- Matplotlib grafov

Skúste experimentovať s rôznymi dátami a vizualizáciami!
