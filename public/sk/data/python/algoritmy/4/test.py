# Import the function
try:
    from main import mincovka_greedy
except ImportError:
    results = [(False, "Inicializácia testovania", "Funkcia mincovka_greedy() nie je definovaná.")]
else:
    # Test cases
    test_cases = [
        ([1, 2, 5, 10, 20, 50, 100], 123, [100, 20, 2, 1], "Test 1: Základný prípad"),
        ([3, 1, 2], 10, [3, 3, 3, 1], "Test 2: Jednoduché platidlá"),
        ([10, 7, 1], 14, [10, 1, 1, 1, 1], "Test 3: Pažravý algoritmus")
    ]

    results = []

    for i, (platidla, suma, expected, name) in enumerate(test_cases):
        result = mincovka_greedy(platidla.copy(), suma)
        if result != expected:
            if i == 2 and result == [7, 7]:
                results.append((False, name, f"Riešenie ({result}) je správne, ale nie je vypočítané pomocou pažravého algoritmu."))
            else:
                results.append((False, name, f"Platidlá: {platidla}, Suma: {suma}, Očakávané: {expected}, Vaše: {result}"))
            break
        else:
            results.append((True, name, ""))
