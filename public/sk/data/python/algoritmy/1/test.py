import random

try:
    from bubble_sort import bubble_sort
except ImportError:
    results = [(False, "Inicializácia testovania", "Funkcia bubble_sort() nie je definovaná.")]
else:
    results = []

    for i in range(10):
        test_array = [random.randint(-50, 50) for _ in range(10)]
        expected = sorted(test_array.copy())
        result = bubble_sort(test_array.copy())

        if result != expected:
            results.append((False, f"Test {i+1}", f"Vstup: {test_array[:5]}..., Očakávaný: {expected[:5]}..., Váš: {result[:5] if result else 'None'}..."))
            break
        else:
            results.append((True, f"Test {i+1}", ""))
