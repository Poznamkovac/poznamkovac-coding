# Viacrozmerné prieskumné techniky

Naučte sa aplikovať pokročilé metódy analýzy viacrozmerných dát vrátane PCA, korelačnej analýzy a zhlukovacej analýzy.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from scipy.cluster.hierarchy import dendrogram, linkage
```

## Načítanie a preskúmanie viacrozmerných dát

Načítajte dataset s viacerými premennými:

```
# Načítajte dáta
data = pd.read_csv('multidimensional_data.csv')
print("Dataset:")
print(data.head())
print(f"\nRozmer: {data.shape}")
print(f"\nStĺpce: {list(data.columns)}")
data
```

## Korelačná analýza

Analyzujte vzťahy medzi premennými:

```
# Výber numerických stĺpcov
numeric_cols = ['Feature1', 'Feature2', 'Feature3', 'Feature4', 'Feature5']
correlation_matrix = data[numeric_cols].corr()

print("Korelačná matica:")
print(correlation_matrix.round(3))

# Vizualizácia korelačnej matice
plt.figure(figsize=(10, 8))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
            square=True, linewidths=1, fmt='.2f', cbar_kws={'label': 'Korelačný koeficient'})
plt.title('Korelačná matica')
plt.tight_layout()
plt.show()

# Nájdite najsilnejšie korelácie
corr_pairs = correlation_matrix.unstack()
corr_pairs = corr_pairs[corr_pairs < 1]  # odstráňte diagonálu
strongest_corr = corr_pairs.abs().max()
print(f"\nNajsilnejšia korelácia: {strongest_corr:.3f}")

correlation_matrix
```

## Analýza hlavných komponentov (PCA)

Redukujte dimenzionalitu dát pomocou PCA:

```
# Štandardizácia dát
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data[numeric_cols])

# Aplikujte PCA
pca = PCA(n_components=5)
pca_components = pca.fit_transform(data_scaled)

# Vysvetlený rozptyl
explained_variance = pca.explained_variance_ratio_
cumulative_variance = np.cumsum(explained_variance)

print("Vysvetlený rozptyl pre každý komponent:")
for i, var in enumerate(explained_variance):
    print(f"  PC{i+1}: {var*100:.2f}%")
print(f"\nKumulatívny vysvetlený rozptyl prvými 2 komponentmi: {cumulative_variance[1]*100:.2f}%")

# Vizualizácia vysvetleného rozptylu
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.bar(range(1, 6), explained_variance * 100)
plt.xlabel('Hlavný komponent')
plt.ylabel('Vysvetlený rozptyl (%)')
plt.title('Vysvetlený rozptyl pre každý komponent')
plt.xticks(range(1, 6), [f'PC{i}' for i in range(1, 6)])
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(range(1, 6), cumulative_variance * 100, 'bo-')
plt.xlabel('Počet komponentov')
plt.ylabel('Kumulatívny vysvetlený rozptyl (%)')
plt.title('Kumulatívny vysvetlený rozptyl')
plt.xticks(range(1, 6))
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# Vytvorte DataFrame s komponentmi
pca_df = pd.DataFrame(
    pca_components[:, :2],
    columns=['PC1', 'PC2']
)

pca_variance_2d = cumulative_variance[1]
pca_variance_2d
```

## Vizualizácia v priestore hlavných komponentov

Vizualizujte dáta v 2D priestore hlavných komponentov:

```
# Scatter plot v priestore PC1 a PC2
plt.figure(figsize=(10, 8))
scatter = plt.scatter(pca_df['PC1'], pca_df['PC2'],
                     c=data['Category'].astype('category').cat.codes,
                     cmap='viridis', alpha=0.6, s=100, edgecolors='black', linewidth=0.5)
plt.xlabel(f'PC1 ({explained_variance[0]*100:.1f}% rozptylu)')
plt.ylabel(f'PC2 ({explained_variance[1]*100:.1f}% rozptylu)')
plt.title('Projekcia dát do priestoru hlavných komponentov')
plt.colorbar(scatter, label='Kategória')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()
```

## Zhlukovacia analýza (K-means)

Identifikujte prirodzené zhluky v dátach:

```
# K-means zhlukovanie
n_clusters = 3
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
clusters = kmeans.fit_predict(data_scaled)

# Pridajte zhluk do datasetu
data['Cluster'] = clusters

print(f"Počet prvkov v jednotlivých zhlukoch:")
print(data['Cluster'].value_counts().sort_index())

# Vizualizácia zhlukov v priestore PCA
plt.figure(figsize=(10, 8))
scatter = plt.scatter(pca_df['PC1'], pca_df['PC2'],
                     c=clusters, cmap='Set1', alpha=0.6, s=100,
                     edgecolors='black', linewidth=0.5)
plt.scatter(pca.transform(scaler.transform(kmeans.cluster_centers_))[:, 0],
           pca.transform(scaler.transform(kmeans.cluster_centers_))[:, 1],
           c='red', marker='X', s=300, edgecolors='black', linewidth=2,
           label='Centrá zhlukov')
plt.xlabel(f'PC1 ({explained_variance[0]*100:.1f}%)')
plt.ylabel(f'PC2 ({explained_variance[1]*100:.1f}%)')
plt.title('K-means zhlukovanie v priestore PCA')
plt.colorbar(scatter, label='Zhluk')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

cluster_counts = data['Cluster'].value_counts()
cluster_counts
```

## Hierarchické zhlukovanie

Vytvorte dendogram pre hierarchickú zhlukovaciu analýzu:

```
# Vypočítajte vzdialenostné spojenia
# Použite len prvých 50 vzoriek pre lepšiu vizualizáciu
sample_size = min(50, len(data_scaled))
linkage_matrix = linkage(data_scaled[:sample_size], method='ward')

# Vytvorte dendrogram
plt.figure(figsize=(12, 6))
dendrogram(linkage_matrix)
plt.title('Hierarchické zhlukovanie (Dendrogram)')
plt.xlabel('Index vzorky')
plt.ylabel('Vzdialenosť')
plt.tight_layout()
plt.show()

print(f"Hierarchické zhlukovanie vytvorené pre {sample_size} vzoriek")
```

## Zhrnutie

Naučili ste sa:
- Analyzovať korelácie medzi viacerými premennými
- Aplikovať PCA pre redukciu dimenzionality
- Interpretovať vysvetlený rozptyl hlavných komponentov
- Vizualizovať dáta v priestore hlavných komponentov
- Aplikovať K-means zhlukovaciu analýzu
- Vytvárať a interpretovať dendrogramy
- Porovnávať rôzne prístupy k analýze viacrozmerných dát

Tieto techniky sú kľúčové pre pochopenie komplexných vzťahov vo vysokorozmerných dátach!
