import random


def merge_sort(pole):
    """
    Funkcia rekurzívne delí pole na dve polovice,
    ktoré sa zlúčia a vytriedia.

    (fáza "rozdeľuj")
    """

    # 1) fáza "rozdeľuj":

    # triviálny prípad – pokiaľ je to jednoprvkové pole
    # a už ho nemôžeme ďalej rozdeliť, tak vrátime toto pole
    if len(pole) <= 1:
        return pole

    # nájdeme prostredný index
    # musí to byť celočíselné delenie,
    # pretože indexy sú celé čísla:
    i_stred = len(pole) // 2

    # rekurzívne zavoláme funkciu pre ďalšie delenie dvoch polovíc
    prava_strana = merge_sort(pole[:i_stred])
    lava_strana = merge_sort(pole[i_stred:])

    # 2) fáza "rieš a panuj":

    # zlúčime dve polovice
    return porovnaj_a_zluc(prava_strana, lava_strana)


def porovnaj_a_zluc(lave_pole, prave_pole):
    """
    Funkcia ktorá zlúči rozdelené polia a vytvorí z nich jedno zoradené pole.

    (fáza "rieš" a "panuj")
    """

    zoradene = []
    i = j = 0

    # pokiaľ máme prvky na porovnávanie v oboch poliach:
    while i < len(lave_pole) and j < len(prave_pole):
        # porovnáme prvky na aktuálnych indexoch

        # ak chceme zoradiť od najväčšieho po najmenší:
        # if lave_pole[i] > prave_pole[j]:
        if lave_pole[i] <= prave_pole[j]:
            # prvok vľavo je menší alebo rovný prvku vpravo
            zoradene.append(lave_pole[i])

            # v ľavom poli prejdeme na ďalší prvok
            i += 1
        else:
            # prvok vpravo je menší ako vľavo
            zoradene.append(prave_pole[j])

            # v pravom poli prejdeme na ďalší prvok
            j += 1

    # pridáme zvyšné prvky z oboch polí
    # (ak je jedno z polí menšie ako druhé, v dôsledku celočíselného delenia,
    # napr.: 9 // 2 = 4 – takže po prvom delení má ľavé pole 4 prvky a pravé 5,
    # čiže 1 prvok vystane pretože porovnávame vždy dvojice - takýto prvok
    # iba pridáme na koniec poľa, zaradí sa na správne miesto v ďalšom rekurzívnom volaní
    # v hlavnej funkcii)
    zoradene.extend(lave_pole[i:])
    zoradene.extend(prave_pole[j:])

    # vrátime zoradené pole
    return zoradene


nahodne_cisla = random.sample(range(100), 9)
print(nahodne_cisla)
print(merge_sort(nahodne_cisla))
