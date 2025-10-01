import sys
from io import StringIO

# Capture output
old_stdout = sys.stdout
sys.stdout = StringIO()

# Import and run main
try:
    with open('main.py', 'r') as f:
        exec(f.read())
    output = sys.stdout.getvalue()
    sys.stdout = old_stdout

    # Test output
    if "Hello, World!" in output:
        print("✓ Výstup obsahuje 'Hello, World!'")
        print("SCORE: 10/10")
        print("FEEDBACK: Perfektne! Váš program správne vypíše Hello World.")
    else:
        print("✗ Výstup neobsahuje 'Hello, World!'")
        print(f"Aktuálny výstup: {output}")
        print("SCORE: 0/10")
        print("FEEDBACK: Skontrolujte, či program vypíše presne 'Hello, World!'")
except Exception as e:
    sys.stdout = old_stdout
    print(f"✗ Chyba pri spustení: {str(e)}")
    print("SCORE: 0/10")
