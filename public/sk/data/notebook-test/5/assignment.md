# Analýza reziduálnych hodnôt a transformácia dát

Naučte sa identifikovať odľahlé hodnoty, analyzovať reziduá a transformovať dáta pre lepšie modelovanie.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import StandardScaler, MinMaxScaler
```

## Načítanie a preskúmanie dát

Načítajte dataset s experimentálnymi meraniami:

```
# Načítajte dáta
data = pd.read_csv('experiment_data.csv')
print("Dataset:")
print(data.head())
print(f"\nRozmer datasetu: {data.shape}")
data
```

## Identifikácia odľahlých hodnôt (outliers)

Použite Z-score a IQR metódu na detekciu outlierov:

```
# Z-score metóda
z_scores = np.abs(stats.zscore(data['Measurement']))
outliers_z = data[z_scores > 3]
print(f"Odľahlé hodnoty (Z-score > 3): {len(outliers_z)}")

# IQR metóda
Q1 = data['Measurement'].quantile(0.25)
Q3 = data['Measurement'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

outliers_iqr = data[(data['Measurement'] < lower_bound) | (data['Measurement'] > upper_bound)]
print(f"Odľahlé hodnoty (IQR metóda): {len(outliers_iqr)}")

# Vizualizácia
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.boxplot(data['Measurement'])
plt.title('Boxplot s odľahlými hodnotami')
plt.ylabel('Meranie')

plt.subplot(1, 2, 2)
plt.scatter(range(len(data)), data['Measurement'], alpha=0.6)
plt.axhline(y=upper_bound, color='r', linestyle='--', label='Horná hranica')
plt.axhline(y=lower_bound, color='r', linestyle='--', label='Dolná hranica')
plt.title('Bodový graf s hranicami')
plt.xlabel('Index')
plt.ylabel('Meranie')
plt.legend()
plt.tight_layout()
plt.show()

outliers_count = len(outliers_iqr)
outliers_count
```

## Lineárna regresia a analýza reziduí

Vytvorte jednoduchý lineárny model a analyzujte reziduá:

```
# Vytvorte lineárny model
from scipy.stats import linregress

x = data['Time']
y = data['Measurement']
slope, intercept, r_value, p_value, std_err = linregress(x, y)

# Vypočítajte predikované hodnoty a reziduá
y_pred = slope * x + intercept
residuals = y - y_pred

print(f"Sklon: {slope:.4f}")
print(f"Intercept: {intercept:.4f}")
print(f"R²: {r_value**2:.4f}")

# Vizualizácia reziduí
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.scatter(x, y, alpha=0.6, label='Dáta')
plt.plot(x, y_pred, 'r-', linewidth=2, label='Lineárna regresia')
plt.xlabel('Čas')
plt.ylabel('Meranie')
plt.title('Lineárna regresia')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.scatter(y_pred, residuals, alpha=0.6)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predikované hodnoty')
plt.ylabel('Reziduá')
plt.title('Rezidual plot')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

residuals_std = residuals.std()
residuals_std
```

## Test normality reziduí

Otestujte, či reziduá majú normálne rozloženie:

```
# Shapiro-Wilk test normality
statistic, p_value_shapiro = stats.shapiro(residuals)
print(f"Shapiro-Wilk test:")
print(f"  Štatistika: {statistic:.4f}")
print(f"  P-hodnota: {p_value_shapiro:.4f}")

if p_value_shapiro > 0.05:
    print("  Reziduá sú pravdepodobne normálne rozložené (p > 0.05)")
else:
    print("  Reziduá nie sú normálne rozložené (p ≤ 0.05)")

# Q-Q plot
plt.figure(figsize=(8, 6))
stats.probplot(residuals, dist="norm", plot=plt)
plt.title('Q-Q Plot reziduí')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

normality_p_value = p_value_shapiro
normality_p_value
```

## Transformácia dát

Aplikujte rôzne transformácie na zlepšenie normality:

```
# Logaritmická transformácia (iba pre kladné hodnoty)
data_positive = data[data['Measurement'] > 0].copy()
data_positive['log_measurement'] = np.log(data_positive['Measurement'])

# Štandardizácia (Z-score normalizácia)
scaler_standard = StandardScaler()
data['measurement_standardized'] = scaler_standard.fit_transform(data[['Measurement']])

# Min-Max normalizácia (škálovanie na 0-1)
scaler_minmax = MinMaxScaler()
data['measurement_normalized'] = scaler_minmax.fit_transform(data[['Measurement']])

print("Porovnanie transformácií:")
print(f"Pôvodné dáta - priemer: {data['Measurement'].mean():.2f}, std: {data['Measurement'].std():.2f}")
print(f"Štandardizované - priemer: {data['measurement_standardized'].mean():.2f}, std: {data['measurement_standardized'].std():.2f}")
print(f"Normalizované - min: {data['measurement_normalized'].min():.2f}, max: {data['measurement_normalized'].max():.2f}")

# Vizualizácia transformácií
plt.figure(figsize=(15, 4))

plt.subplot(1, 3, 1)
plt.hist(data['Measurement'], bins=20, edgecolor='black', alpha=0.7)
plt.title('Pôvodné dáta')
plt.xlabel('Meranie')

plt.subplot(1, 3, 2)
plt.hist(data['measurement_standardized'], bins=20, edgecolor='black', alpha=0.7)
plt.title('Štandardizované dáta')
plt.xlabel('Z-score')

plt.subplot(1, 3, 3)
plt.hist(data['measurement_normalized'], bins=20, edgecolor='black', alpha=0.7)
plt.title('Normalizované dáta (0-1)')
plt.xlabel('Normalizovaná hodnota')

plt.tight_layout()
plt.show()

transformed_data = data[['Measurement', 'measurement_standardized', 'measurement_normalized']]
transformed_data
```

## Zhrnutie

Naučili ste sa:

- Identifikovať odľahlé hodnoty pomocou Z-score a IQR metódy
- Vytvárať lineárne regresné modely a vypočítavať reziduá
- Analyzovať reziduá pomocou rezidual plots
- Testovať normalitu reziduí (Shapiro-Wilk test, Q-Q plot)
- Aplikovať transformácie dát (log, štandardizácia, normalizácia)
- Vizualizovať efekty transformácií

Analýza reziduí a transformácia dát sú kľúčové pre validáciu modelov a prípravu dát!
