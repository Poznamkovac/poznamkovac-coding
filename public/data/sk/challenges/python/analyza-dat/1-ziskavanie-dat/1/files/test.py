import sys
import io
from contextlib import redirect_stdout

# Capture stdout
output = io.StringIO()
with redirect_stdout(output):
    try:
        from main import *  # type: ignore
    except Exception as e:
        print(f"Chyba pri importovaní: {e}", file=sys.stderr)
        sys.exit(1)

output_text = output.getvalue()

# Check if output contains expected elements
if 'Inception' not in output_text:
    print("Nenašiel som film 'Inception' vo výstupe", file=sys.stderr)
    sys.exit(1)

if 'The Matrix' not in output_text:
    print("Nenašiel som film 'The Matrix' vo výstupe", file=sys.stderr)
    sys.exit(1)

if '8.8' not in output_text and '8,8' not in output_text:
    print("Nenašiel som hodnotenie 8.8 vo výstupe", file=sys.stderr)
    sys.exit(1)

# Check for count
if '4' not in output_text:
    print("Nenašiel som počet filmov (4) vo výstupe", file=sys.stderr)
    sys.exit(1)

# Check for average rating (8.65)
if '8.6' not in output_text and '8,6' not in output_text:
    print("Nenašiel som priemernú hodnotu hodnotenia vo výstupe", file=sys.stderr)
    sys.exit(1)

print("✅ Výborne! DataFrame bol vytvorený správne a všetky výpočty sú korektné.")
