import sys

# Import user's code
try:
    with open('main.py', 'r') as f:
        exec(f.read(), globals())

    score = 0
    max_score = 20

    # Test 1: Even number
    if is_even(4) == True:
        print("✓ Test 1: is_even(4) = True")
        score += 5
    else:
        print(f"✗ Test 1: is_even(4) očakávané True, dostali sme {is_even(4)}")

    # Test 2: Odd number
    if is_even(7) == False:
        print("✓ Test 2: is_even(7) = False")
        score += 5
    else:
        print(f"✗ Test 2: is_even(7) očakávané False, dostali sme {is_even(7)}")

    # Test 3: Zero
    if is_even(0) == True:
        print("✓ Test 3: is_even(0) = True")
        score += 5
    else:
        print(f"✗ Test 3: is_even(0) očakávané True, dostali sme {is_even(0)}")

    # Test 4: Negative even
    if is_even(-8) == True:
        print("✓ Test 4: is_even(-8) = True")
        score += 5
    else:
        print(f"✗ Test 4: is_even(-8) očakávané True, dostali sme {is_even(-8)}")

    print(f"\nSCORE: {score}/{max_score}")

    if score == max_score:
        print("FEEDBACK: Perfektné! Vaša funkcia správne kontroluje párnosť.")
    elif score >= 15:
        print("FEEDBACK: Veľmi dobre! Jedna malá chyba.")
    elif score > 0:
        print("FEEDBACK: Dobrý pokus! Použite operátor modulo (%).")
    else:
        print("FEEDBACK: Funkcia musí vrátiť True pre párne čísla, False pre nepárne.")

except NameError:
    print("✗ Chyba: Funkcia 'is_even' nie je definovaná")
    print("SCORE: 0/20")
    print("FEEDBACK: Definujte funkciu is_even(n).")
except Exception as e:
    print(f"✗ Chyba: {str(e)}")
    print("SCORE: 0/20")
