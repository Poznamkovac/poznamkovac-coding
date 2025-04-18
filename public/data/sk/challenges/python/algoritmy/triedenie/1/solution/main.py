def bubble_sort(pole):
    n = len(pole)
    for i in range(n-1, -1, -1):
        for j in range(i):
            if pole[j] > pole[j+1]:
                pole[j], pole[j+1] = pole[j+1], pole[j]

    return pole
