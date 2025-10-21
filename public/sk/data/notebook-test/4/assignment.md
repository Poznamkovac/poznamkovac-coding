# Vizualizácia dát

Naučte sa vytvárať rôzne typy grafov a vizualizácií pomocou matplotlib a seaborn.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Nastavenie štýlu pre seaborn
sns.set_style("whitegrid")
```

## Načítanie dát

Načítajte dataset s ekonomickými ukazovateľmi:

```
# Načítajte dáta
data = pd.read_csv('economic_data.csv')
print("Dataset:")
print(data.head())
data
```

## Histogram a rozloženie dát

Vytvorte histogram na zobrazenie rozloženia hodnôt:

```
# Vytvorte histogram pre GDP
plt.figure(figsize=(10, 6))
plt.hist(data['GDP'], bins=15, edgecolor='black', alpha=0.7)
plt.title('Rozloženie GDP')
plt.xlabel('GDP (miliardy USD)')
plt.ylabel('Početnosť')
plt.grid(True, alpha=0.3)
plt.show()
```

## Krabicový diagram (boxplot)

Použijte boxplot na identifikáciu odľahlých hodnôt:

```
# Vytvorte boxplot pre GDP podľa regiónov
plt.figure(figsize=(10, 6))
sns.boxplot(data=data, x='Region', y='GDP')
plt.title('GDP podľa regiónov')
plt.xlabel('Región')
plt.ylabel('GDP (miliardy USD)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

## Bodový graf (scatter plot)

Vizualizujte vzťah medzi dvoma premennými:

```
# Vytvorte scatter plot GDP vs Population
plt.figure(figsize=(10, 6))
plt.scatter(data['Population'], data['GDP'], alpha=0.6, s=100)
plt.title('Vzťah medzi populáciou a GDP')
plt.xlabel('Populácia (milióny)')
plt.ylabel('GDP (miliardy USD)')
plt.grid(True, alpha=0.3)

# Pridajte trend line
z = np.polyfit(data['Population'], data['GDP'], 1)
p = np.poly1d(z)
plt.plot(data['Population'], p(data['Population']), "r--", alpha=0.8, linewidth=2)
plt.show()
```

## Stĺpcový graf s chybovými úsečkami

Porovnajte priemery medzi skupinami:

```
# Vypočítajte priemery a smerodajné odchýlky pre regióny
region_stats = data.groupby('Region')['GDP'].agg(['mean', 'std']).reset_index()

# Vytvorte stĺpcový graf
plt.figure(figsize=(10, 6))
plt.bar(region_stats['Region'], region_stats['mean'],
        yerr=region_stats['std'], capsize=5, alpha=0.7, edgecolor='black')
plt.title('Priemerné GDP podľa regiónov')
plt.xlabel('Región')
plt.ylabel('Priemerné GDP (miliardy USD)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

## Heatmapa korelácií

Vytvorte korelačnú maticu:

```
# Vypočítajte korelačnú maticu pre numerické stĺpce
correlation_matrix = data[['GDP', 'Population', 'Unemployment', 'Inflation']].corr()

# Vytvorte heatmapu
plt.figure(figsize=(8, 6))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
            square=True, linewidths=1, fmt='.2f')
plt.title('Korelačná matica ekonomických ukazovateľov')
plt.tight_layout()
plt.show()
```

## Zhrnutie

Naučili ste sa:
- Vytvárať histogramy pre zobrazenie rozloženia dát
- Používať boxploty na identifikáciu odľahlých hodnôt
- Vytvárať scatter ploty na vizualizáciu vzťahov
- Vytvárať stĺpcové grafy s chybovými úsečkami
- Vytvárať heatmapy korelačných matíc
- Používať matplotlib a seaborn pre profesionálne vizualizácie

Vizualizácia je kľúčová pre pochopenie a komunikáciu insights z dát!
