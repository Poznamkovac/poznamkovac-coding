try:
    from fibonacci_dp import fibonacci
except ImportError:
    raise ImportError("Funkcia `fibonacci()` nie je definovaná.")

try:
    from fibonacci_dp import dp
except ImportError:
    raise ImportError("Premenná s medzivýsledkami `dp` nie je definovaná.")

fibonacci(20)
assert dp[0] == 0
assert dp[1] == 1
assert dp[5] == 5
assert dp[10] == 55
assert dp[15] == 610
assert dp[20] == 6765
