# Získavanie dát zo zdrojov

Naučte sa načítavať a spracovávať dáta z rôznych formátov pomocou knižníc pandas, numpy a scipy.

## Setup

Najprv importujme potrebné knižnice:

```[readonly,mustExecute]
import numpy as np
import pandas as pd
from scipy import stats
```

## Načítanie CSV súboru

Načítajte dáta zo súboru CSV a preskúmajte ich štruktúru:

```
# Načítajte dáta z CSV súboru
data = pd.read_csv('students.csv')
print("Prvých 5 riadkov:")
print(data.head())
print(f"\nPočet riadkov a stĺpcov: {data.shape}")
data
```

## Základné informácie o dátach

Zistite základné informácie o datasete:

```
# Zobrazte informácie o stĺpcoch a typoch dát
print("Informácie o datasete:")
print(data.info())

# Zobrazte popisné štatistiky
summary = data.describe()
print("\nPopisné štatistiky:")
summary
```

## Práca s chýbajúcimi hodnotami

Identifikujte a spracujte chýbajúce hodnoty:

```
# Zistite počet chýbajúcich hodnôt v každom stĺpci
missing_values = data.isnull().sum()
print("Chýbajúce hodnoty:")
print(missing_values)

# Odstráňte riadky s chýbajúcimi hodnotami
data_clean = data.dropna()
print(f"\nPočet riadkov po odstránení chýbajúcich hodnôt: {len(data_clean)}")
data_clean
```

## Vytvorenie nových stĺpcov

Pridajte vypočítané stĺpce do datasetu:

```
# Vypočítajte priemernú známku pre každého študenta
data_clean['average_score'] = data_clean[['Math', 'Physics', 'Chemistry']].mean(axis=1)

# Vytvorte kategóriu výkonu
data_clean['performance'] = pd.cut(
    data_clean['average_score'],
    bins=[0, 60, 80, 100],
    labels=['Nedostatočný', 'Dobrý', 'Výborný']
)

print("Dataset s novými stĺpcami:")
data_clean
```

## Zhrnutie

Naučili ste sa:

- Načítavať CSV súbory pomocou pandas
- Analyzovať základné informácie o datasete
- Identifikovať a spracovávať chýbajúce hodnoty
- Vytvárať nové vypočítané stĺpce
- Kategorizovať dáta pomocou binov

Skúste experimentovať s rôznymi metódami spracovania dát!
