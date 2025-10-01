import pandas as pd

# Vytvorenie CSV súboru
with open('kava.csv', 'w', encoding='utf-8') as f:
    f.write('deň,šálky,tržba\n')
    f.write('Pondelok,45,180\n')
    f.write('Utorok,52,208\n')
    f.write('Streda,48,192\n')
    f.write('Štvrtok,61,244\n')
    f.write('Piatok,73,292\n')

# Načítanie CSV súboru
df = pd.read_csv('kava.csv')

# Vypísanie DataFrame
print(df)
print()

# Celkový počet predaných šálok
print(f"Celkový počet šálok: {df['šálky'].sum()}")

# Celková tržba
print(f"Celková tržba: {df['tržba'].sum()} €")
