import pandas as pd

# Vytvorenie DataFrame so skladovými dátami
df = pd.DataFrame({
    'produkt': ['Notebook', 'Myš', 'Stôl', 'Stolička', 'Monitor'],
    'cena': [899, 15, 120, 65, 250],
    'pocet': [5, 45, 8, 12, 3],
    'kategoria': ['Elektro', 'Elektro', 'Nábytok', 'Nábytok', 'Elektro']
})

# Produkty s nízkym stavom (< 10 ks)
print("Produkty s nízkym stavom (< 10 ks):")
print(df[df['pocet'] < 10])
print()

# Elektro produkty
print("Elektro produkty:")
print(df[df['kategoria'] == 'Elektro'])
print()

# Drahé produkty (> 100€)
print("Drahé produkty (> 100€):")
print(df[df['cena'] > 100])
print()

# Celková hodnota skladu
df['hodnota'] = df['cena'] * df['pocet']
celkova_hodnota = df['hodnota'].sum()
print(f"Celková hodnota skladu: {celkova_hodnota} €")
