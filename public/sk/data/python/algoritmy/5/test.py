try:
    from fibonacci_dp import fibonacci, dp
except ImportError:
    results = [(False, "Inicializácia testovania", "Funkcia fibonacci() alebo premenná dp nie je definovaná.")]
else:
    # Run fibonacci to populate dp
    result = fibonacci(20)

    results = []

    # Check specific values in dp
    expected_values = {
        0: 0,
        1: 1,
        5: 5,
        10: 55,
        15: 610,
        20: 6765
    }

    for n, expected in expected_values.items():
        if n not in dp:
            results.append((False, f"Kontrola dp[{n}]", f"Hodnota dp[{n}] nie je v slovníku dp. Používate memoizáciu?"))
            break
        if dp[n] != expected:
            results.append((False, f"Kontrola dp[{n}]", f"Nesprávna hodnota. Očakávané: {expected}, Vaše: {dp[n]}"))
            break
        results.append((True, f"Kontrola dp[{n}]", ""))

    # Check that fibonacci(20) returns correct value
    if result != 6765:
        results.append((False, "fibonacci(20)", f"Vrátilo {result}, očakávané: 6765"))
    else:
        results.append((True, "fibonacci(20)", ""))
