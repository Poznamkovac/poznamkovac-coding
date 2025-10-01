import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = StringIO()

try:
    with open('main.py', 'r') as f:
        exec(f.read())
    output = sys.stdout.getvalue()
    sys.stdout = old_stdout

    if "Hello, World!" in output:
        print("✓ Výstup obsahuje 'Hello, World!'")
    else:
        print("✗ Výstup neobsahuje 'Hello, World!'")
except Exception as e:
    sys.stdout = old_stdout
    print(f"✗ Chyba pri spustení: {str(e)}")
    print("SCORE: 0/10")
