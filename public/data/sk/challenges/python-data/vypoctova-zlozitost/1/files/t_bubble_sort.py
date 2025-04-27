def t_bubble_sort(arr):
    vymeny = 0
    n = len(arr)

    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                vymeny += 1

    return vymeny