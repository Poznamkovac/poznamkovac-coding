# Úvod do počítačovej analýzy dát

V Pythone je k dispozícií modul `pandas`, ktorý umožňuje manipulovať s tabuľkovými dátami. Na to, aby sme ho mohli používať, ho musíme najskôr nainštalovať, napríklad takto: `pip install pandas`.

Modul `pandas` najlepšie pracuje s tabuľkami uloženými v súboroch CSV. V tomto notebooku sa naučíme, ako načítať CSV súbor a filtrovať jeho obsah.

Najskôr je potrebné si modul importovať:

```mustexecute
import pandas as pd
```

Konvenciou je, že modul importujeme pod aliasom `pd`, čo vráti krátku a ľahko zapamätateľnú skratku. Môžeme samozrejme zvoliť aj iný spôsob zápisu príkazu `import`, ako napríklad `import pandas` (nevhodné, pretože každý prístup k príkazom má dlhú predponu `pandas.`) alebo `from pandas import ...` (v tomto prípade by sme museli každú funkciu importovať individuálne).

## Načítanie CSV súboru

Skratka CSV znamená "Comma-Separated Values", teda súbor, kde je každá hodnota oddelená čiarkami a každý záznam zodpovedá jednému riadku. Napríklad:

```readonly
"""
Number,City,Gender,Age,Income,Illness
1,Dallas,Male,41,40367.0,No
2,Dallas,Male,54,45084.0,No
3,Dallas,Male,42,52483.0,No
4,Dallas,Male,40,40941.0,No
5,Dallas,Male,46,50289.0,No
"""
```

Prvý riadok je hlavička - definuje názvy jednotlivých stĺpcov (ako prvý riadok v tabuľke). Ďalšie riadky sú údaje - každý záznam zodpovedá jednému riadku a hodnoty jednotlivých stĺpcov sú oddelené čiarkami.

Modul `pandas` ale nepracuje priamo so surovými textovými dátami. Predtým, ako môžeme s dátami pracovať, ich musíme načítať do tzv. `DataFrame`. Je to vlastná trieda v moduli `pandas`, ktorá definuje metódy pre efektívne a jednoduché manipulácie s dátami. `DataFrame` má v podstate rovnakú podobu ako klasická tabuľka s riadkami a stĺpcami.

V tomto notebooku sa nachádza súbor `data.csv`, ktorý obsahuje údaje zo vzorky vyššie. Ak chceme tieto dáta načítať do `DataFrame`, použijeme funkciu `pd.read_csv`:

```
df = pd.read_csv("data.csv")
```

Premenná, v ktorej je `DataFrame` uložený sa nazýva `df`. Mohli by sme samozrejme opätovne zvoliť ľubovoľný iný názov (podľa pravidiel premenných v Pythone), ale konvenčne sa používa `df` (ako skratka pre "data frame").

## Zobrazenie obsahu DataFrame

Ak chceme zobraziť obsah `DataFrame`, môžeme na výstupe jednoducho vypísať `df`:

```
df
```

Alebo môžeme použiť funkciu `head`, ktorá zobrazí prvých 5 riadkov `DataFrame`:

```
df.head()
```
