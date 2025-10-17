stdout = context.get('stdout', '')

results = []

# Check if output contains "Hello, World!"
if 'hello, world' in stdout.lower():
    results.append((True, "Kontrola výstupu", ""))
else:
    results.append((False, "Kontrola výstupu", f'Očakávany výstup "Hello, World!", ale dostal som: "{stdout}"'))
