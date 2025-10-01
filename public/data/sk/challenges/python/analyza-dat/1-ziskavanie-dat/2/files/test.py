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

# Check for days
if 'Pondelok' not in output_text or 'Piatok' not in output_text:
    print("Nenašiel som všetky dni týždňa vo výstupe", file=sys.stderr)
    sys.exit(1)

# Check for total cups (279)
if '279' not in output_text:
    print("Nenašiel som celkový počet šálok (279) vo výstupe", file=sys.stderr)
    sys.exit(1)

# Check for total revenue (1116)
if '1116' not in output_text:
    print("Nenašiel som celkovú tržbu (1116) vo výstupe", file=sys.stderr)
    sys.exit(1)

print("✅ Výborne! CSV súbor bol načítaný a analyzovaný správne.")
