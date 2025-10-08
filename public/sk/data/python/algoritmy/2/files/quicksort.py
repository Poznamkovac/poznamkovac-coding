import random


def rozklad(pole, low, high):
    """
    Funkcia rozdelí pole na dve časti - prvky menšie ako pivot a prvky väčšie ako pivot.

    Argumenty:
    - `pole`: Zoznam prvkov na rozdelenie
    - `low`: Začiatočný index časti poľa na rozdelenie
    - `high`: Koncový index časti poľa na rozdelenie

    Návratová hodnota:
    - Index, kde sa nachádza pivot po rozdelení
    """

    # vyberieme posledný prvok ako pivot
    pivot = pole[high]

    # index pre menší prvok,
    # predvolene je to prvý prvok v podmnožine
    i = low - 1

    # prechádzame všetky prvky v podmnožine,
    # okrem pivota (posledného prvku)
    # cieľom je umiestniť menšie prvky naľavo od pivota
    # a väčšie prvky napravo od pivota:
    for j in range(low, high):
        # ak je aktuálny prvok menší alebo rovný pivotu...
        if pole[j] <= pivot:
            # ...zvýšime index menšieho prvku
            i += 1
            # ...a vymeníme prvky na pozíciách `i` a `j`
            # (takto sa menšie prvky posúvajú naľavo od pivota)
            pole[i], pole[j] = pole[j], pole[i]

            # logicky, ak usporiadame všetky menšie prvky správne,
            # tak zvyšné prvky budú väčšie
            # ...ak potom znovu a znovu usporiadame menšie prvky v
            # tejto podmnožine správne, tak sa nakoniec pole usporiada

    # umiestnime pivot na správnu pozíciu
    # (medzi menšími a väčšími prvkami):
    pole[i + 1], pole[high] = pole[high], pole[i + 1]

    # vrátime index nového pivota
    return i + 1


def quicksort(pole, low=0, high=None):
    """
    Funkcia zoradí pole pomocou algoritmu quick-sort.

    Argumenty:
    - `pole`: Zoznam prvkov na zoradenie
    - `low`: Začiatočný index časti poľa na zoradenie
    - `high`: Koncový index časti poľa na zoradenie
    """

    # ak high nie je zadaný, nastavíme ho na koniec poľa
    if high is None:
        high = len(pole) - 1

    # kontrola, či máme čo zoraďovať (aspoň 2 prvky)
    if low < high:
        # získame index pivota po rozdelení poľa
        pivot_index = rozklad(pole, low, high)

        # rekurzívne zoradíme ľavú časť poľa (prvky menšie ako pivot)
        quicksort(pole, low, pivot_index - 1)

        # rekurzívne zoradíme pravú časť poľa (prvky väčšie ako pivot)
        quicksort(pole, pivot_index + 1, high)


nahodne_pole = random.sample(range(1, 100), 10)
print("Pôvodné pole:", nahodne_pole)

quicksort(nahodne_pole)
print("Usporiadané pole:", nahodne_pole)
