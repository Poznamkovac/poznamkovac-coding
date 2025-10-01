import sys
import io
from contextlib import redirect_stdout

output = io.StringIO()
with redirect_stdout(output):
    try:
        from main import *  # type: ignore
    except Exception as e:
        print(f"Chyba pri importovaní: {e}", file=sys.stderr)
        sys.exit(1)

output_text = output.getvalue()

# Check for low stock products (Notebook, Stôl, Monitor)
if 'Notebook' not in output_text or 'Monitor' not in output_text:
    print("Nenašiel som produkty s nízkym stavom", file=sys.stderr)
    sys.exit(1)

# Check for Elektro category
if not (output_text.count('Elektro') >= 3):
    print("Nenašiel som všetky Elektro produkty", file=sys.stderr)
    sys.exit(1)

# Check for expensive products (> 100€)
if not ('Notebook' in output_text and ('Monitor' in output_text or 'Stôl' in output_text)):
    print("Nenašiel som správne drahé produkty", file=sys.stderr)
    sys.exit(1)

# Check for total value (5920)
if '5920' not in output_text:
    print("Celková hodnota skladu nie je správna (očakávaná hodnota: 5920)", file=sys.stderr)
    sys.exit(1)

print("✅ Výborne! Všetky filtre a výpočty sú správne.")
