# Pažravá mincovka

Máme k dispozícii platidlá s hodnotami `[1, 2, 5, 10, 20, 50, 100]`. Funkcia `mincovka_greedy(platidla, suma)` vráti zoznam platidiel, ktoré treba použiť pre rozmenenie danej sumy (zoradené od najväčšieho po najmenšie).

Implementuj funkciu tak, aby fungovala správne, napríklad (pre `platidla = [1, 2, 5, 10, 20, 50, 100]`):

```python
mincovka_greedy(platidla, 123) # -> [100, 20, 2, 1]
```

Použi pažravý (greedy) algoritmus!
