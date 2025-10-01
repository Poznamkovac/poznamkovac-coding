import pandas as pd

# Vytvorenie DataFrame s údajmi o filmoch
df = pd.DataFrame({
    'názov': ['Inception', 'The Matrix', 'Interstellar', 'The Prestige'],
    'rok': [2010, 1999, 2014, 2006],
    'hodnotenie': [8.8, 8.7, 8.6, 8.5]
})

# Vypísanie celého DataFrame
print(df)
print()

# Vypísanie počtu filmov
print(f"Počet filmov: {len(df)}")

# Vypísanie priemerného hodnotenia
print(f"Priemerné hodnotenie: {df['hodnotenie'].mean()}")
