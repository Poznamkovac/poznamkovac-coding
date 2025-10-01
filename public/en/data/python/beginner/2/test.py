import sys
from io import StringIO

# Import user's code
try:
    with open('main.py', 'r') as f:
        exec(f.read(), globals())

    score = 0
    max_score = 15

    # Test 1: Basic addition
    if add(2, 3) == 5:
        print("✓ Test 1: add(2, 3) = 5")
        score += 5
    else:
        print(f"✗ Test 1: add(2, 3) očakávané 5, dostali sme {add(2, 3)}")

    # Test 2: Larger numbers
    if add(100, 200) == 300:
        print("✓ Test 2: add(100, 200) = 300")
        score += 5
    else:
        print(f"✗ Test 2: add(100, 200) očakávané 300, dostali sme {add(100, 200)}")

    # Test 3: Negative numbers
    if add(-10, 5) == -5:
        print("✓ Test 3: add(-10, 5) = -5")
        score += 5
    else:
        print(f"✗ Test 3: add(-10, 5) očakávané -5, dostali sme {add(-10, 5)}")

    print(f"\nSCORE: {score}/{max_score}")

    if score == max_score:
        print("FEEDBACK: Výborná práca! Vaša funkcia funguje správne.")
    elif score > 0:
        print("FEEDBACK: Dobrý pokus! Skontrolujte chybné testy.")
    else:
        print("FEEDBACK: Funkcia add() musí vrátiť súčet dvoch čísel.")

except NameError as e:
    print(f"✗ Chyba: Funkcia 'add' nie je definovaná")
    print("SCORE: 0/15")
    print("FEEDBACK: Definujte funkciu add(a, b), ktorá vráti súčet.")
except Exception as e:
    print(f"✗ Chyba pri spustení: {str(e)}")
    print("SCORE: 0/15")
