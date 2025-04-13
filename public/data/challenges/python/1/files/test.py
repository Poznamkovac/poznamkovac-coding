try:
    from main import hello  # type: ignore
except ImportError:
    raise ImportError("Function `hello()` is not defined.")

result = hello()
print(result)
if result != "Hello, World!":
    raise ValueError(f"Function `hello()` returned wrong value: `{result}` instead of `Hello, World!`")
