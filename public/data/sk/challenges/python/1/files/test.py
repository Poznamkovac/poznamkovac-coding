try:
    from main import ahoj  # type: ignore
except ImportError:
    raise ImportError("Funkcia `ahoj()` nie je definovaná.")

result = ahoj()
print(result)
if result != "Ahoj, svet!":
    raise ValueError(f"Funkcia `ahoj()` vrátila nesprávnu hodnotu: `{result}` namiesto `Ahoj, svet!`")
