dp = {
    0: 0,
    1: 1,
}

def fibonacci(n):
    if n in dp:
        return dp[n]

    dp[n] = fibonacci(n-1) + fibonacci(n-2)
    return dp[n]
