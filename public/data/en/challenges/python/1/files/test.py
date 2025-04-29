try:
    from main import funkcia  # type: ignore  # noqa: F401
except ImportError:
    raise ImportError("Funkcia `funkcia()` nie je definovaná.")

# TODO: testy
