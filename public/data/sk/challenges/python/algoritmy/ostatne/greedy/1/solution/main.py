def mincovka_greedy(platidla, suma):
    platidla.sort(reverse=True)
    rozmenene = []

    index_mince = 0
    while index_mince < len(platidla):
        nova_suma = suma - platidla[index_mince]
        if nova_suma < 0:
            index_mince += 1
            continue

        suma = nova_suma
        rozmenene.append(platidla[index_mince])

    return rozmenene
