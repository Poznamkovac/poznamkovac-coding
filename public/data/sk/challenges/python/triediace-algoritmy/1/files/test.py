try:
    from main import bubble_sort
except ImportError:
    raise ImportError("Funkcia `bubble_sort()` nie je definovaná.")

import random

nahodne_vstupy = [[random.randint(-50, 50) for _ in range(10)] for _ in range(10)]

for vstup in nahodne_vstupy:
    ocakavany_vystup = sorted(vstup.copy())
    vystup = bubble_sort(vstup.copy())

    if vystup != ocakavany_vystup:
        print("vstup:", vstup)
        print("výstup:", vystup)
        print("očakávaný výstup:", ocakavany_vystup)

        raise ValueError("Funkcia `bubble_sort()` vrátila nesprávnu hodnotu.")

print("OK")
