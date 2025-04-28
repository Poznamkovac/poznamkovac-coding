try:
    from main import mincovka_greedy  # type: ignore
except ImportError:
    raise ImportError("Funkcia `mincovka_greedy()` nie je definovaná.")

r1 = mincovka_greedy([1, 2, 5, 10, 20, 50, 100], 123)
assert r1 == [100, 20, 2, 1], f"Nesprávne riešenie pre sumu 123: {r1}"

r2 = mincovka_greedy([3, 1, 2], 10)
assert r2 == [3, 3, 3, 1], f"Nesprávne riešenie pre sumu 10: {r2}"

specialny_pripad = mincovka_greedy([10, 7, 1], 14)
if specialny_pripad == [7, 7]:
    raise ValueError(
        f"Riešenie pre rozmenenie sumy 14 ({specialny_pripad}) je správne, ale nie je to vypočítané pomocou pažravého algoritmu."
    )
elif specialny_pripad != [10, 1, 1, 1, 1]:
    raise ValueError(
        f"Riešenie pre rozmenenie sumy 14 ({specialny_pripad}) nie je správne."
    )

print(f"""
suma 123 -> {r1}
suma 10 -> {r2}
suma 14 -> {specialny_pripad}
""".strip())
print("\nOK")
