def bubble_sort(pole):
    n = len(pole)
    for i in range(n):
        for j in range(n-i-1):
            if pole[j] > pole[j+1]:
                pole[j], pole[j+1] = pole[j+1], pole[j]

    return pole
