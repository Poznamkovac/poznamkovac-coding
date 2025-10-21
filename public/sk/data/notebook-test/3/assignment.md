# Početnosti a popisné charakteristiky

Naučte sa vypočítavať početnosti, miery centrálnej tendencie a miery variability pomocou pandas a numpy.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
from scipy import stats
```

## Načítanie a preskúmanie dát

Načítajte dataset s meraniami:

```
# Načítajte dáta
data = pd.read_csv('measurements.csv')
print("Dataset:")
print(data.head(10))
data
```

## Početnosti a frekvencie

Vypočítajte početnosti pre kategorické premenné:

```
# Vypočítajte početnosti pre kategóriu
category_counts = data['Category'].value_counts()
print("Početnosti kategórií:")
print(category_counts)

# Vypočítajte relatívne frekvencie (percentá)
category_freq = data['Category'].value_counts(normalize=True) * 100
print("\nRelatívne frekvencie (%):")
print(category_freq.round(2))
category_counts
```

## Miery centrálnej tendencie

Vypočítajte priemer, medián a modus:

```
# Výber numerických dát
values = data['Value']

# Priemer (aritmetický priemer)
mean_value = values.mean()
print(f"Priemer: {mean_value:.2f}")

# Medián (stredná hodnota)
median_value = values.median()
print(f"Medián: {median_value:.2f}")

# Modus (najčastejšia hodnota)
mode_result = stats.mode(values, keepdims=True)
mode_value = mode_result.mode[0]
print(f"Modus: {mode_value:.2f}")

# Uložte výsledky
central_tendency = {
    'mean': mean_value,
    'median': median_value,
    'mode': mode_value
}
central_tendency
```

## Miery variability

Vypočítajte rozptyl, smerodajnú odchýlku a kvartily:

```
# Rozptyl
variance = values.var()
print(f"Rozptyl: {variance:.2f}")

# Smerodajná odchýlka
std_dev = values.std()
print(f"Smerodajná odchýlka: {std_dev:.2f}")

# Kvartily
q1 = values.quantile(0.25)
q2 = values.quantile(0.50)  # medián
q3 = values.quantile(0.75)

print(f"\nKvartily:")
print(f"Q1 (25%): {q1:.2f}")
print(f"Q2 (50%): {q2:.2f}")
print(f"Q3 (75%): {q3:.2f}")

# Interkvartilovné rozpätie
iqr = q3 - q1
print(f"IQR: {iqr:.2f}")

variability = {
    'variance': variance,
    'std': std_dev,
    'iqr': iqr
}
variability
```

## Popisné štatistiky podľa skupín

Vypočítajte popisné štatistiky pre každú kategóriu:

```
# Zoskupenie podľa kategórie
grouped_stats = data.groupby('Category')['Value'].describe()
print("Popisné štatistiky podľa kategórie:")
grouped_stats
```

## Zhrnutie

Naučili ste sa:
- Vypočítavať početnosti a frekvencie
- Určovať miery centrálnej tendencie (priemer, medián, modus)
- Vypočítavať miery variability (rozptyl, smerodajná odchýlka, IQR)
- Analyzovať dáta podľa skupín
- Interpretovať popisné štatistiky

Tieto základné charakteristiky sú kľúčové pre exploračnú analýzu dát!
