# Turso Cloud Database Setup Gids

## Waarom Turso?

Turso is een **gratis** cloud database service speciaal voor SQLite. Perfect voor SJChess omdat:
- ✅ **Gratis tier:** 9 GB storage, 1 miljard row reads per maand
- ✅ **Snel:** Edge locations wereldwijd
- ✅ **SQLite:** Zelfde database als lokaal, maar in de cloud
- ✅ **Gedeeld:** Jij en je collega kunnen tegelijk werken

## Stap 1: Account Aanmaken

1. Ga naar [https://turso.tech](https://turso.tech)
2. Klik op "Sign up" of "Get Started"
3. Maak een account aan (via GitHub of email)
4. Bevestig je email adres

## Stap 2: Database Aanmaken

### Via Web Dashboard:

1. Log in op [https://app.turso.tech](https://app.turso.tech)
2. Klik op "+ Create Database"
3. Vul in:
   - **Name:** `sjchess` (of een andere naam)
   - **Location:** Kies de dichtstbijzijnde locatie (bijv. Amsterdam)
4. Klik "Create"

### Of via CLI (gevorderd):

```bash
# Installeer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Maak database
turso db create sjchess
```

## Stap 3: Database URL en Token Ophalen

### Via Web Dashboard:

1. Klik op je nieuwe database
2. Kopieer de **Database URL** (begint met `libsql://`)
   - Bijvoorbeeld: `libsql://sjchess-jouwnaam.turso.io`
3. Ga naar "API Tokens" tab
4. Klik "+ Create Token"
5. Geef het een naam (bijv. "SJChess App")
6. Kopieer het token (begint met `eyJ...`)

**⚠️ BELANGRIJK:** Bewaar je token veilig! Je kunt het maar 1x zien.

### Of via CLI:

```bash
# Database URL ophalen
turso db show sjchess

# Token aanmaken
turso db tokens create sjchess
```

## Stap 4: In SJChess Configureren

1. Open SJChess
2. Ga naar **Instellingen** (onderaan in het menu)
3. Selecteer **"Turso Cloud Database"**
4. Plak je **Database URL** (bijv. `libsql://sjchess-jouwnaam.turso.io`)
5. Plak je **Auth Token** (lange string die begint met `eyJ...`)
6. Klik **"Opslaan"**
7. **Herstart** de applicatie

## Stap 5: Testen

1. Start SJChess opnieuw
2. Maak een test tornooi aan
3. Laat je collega ook SJChess openen (met dezelfde credentials)
4. Jullie zouden nu dezelfde data moeten zien! 🎉

## Data Migreren van Lokaal naar Cloud

Als je al lokale data hebt die je wilt overzetten:

### Optie 1: Handmatig (klein dataset)
- Voer je data opnieuw in terwijl je verbonden bent met Turso

### Optie 2: Via Turso CLI (groot dataset)
```bash
# Exporteer lokale database
# Vind je lokale database:
# - Windows: %APPDATA%/sjchess/sjchess.db
# - Linux: ~/.config/sjchess/sjchess.db
# - macOS: ~/Library/Application Support/sjchess/sjchess.db

# Importeer naar Turso
turso db shell sjchess < local-export.sql
```

## Troubleshooting

### "Failed to connect"
- ✅ Check je internet verbinding
- ✅ Controleer of URL en token correct zijn (geen extra spaties)
- ✅ Verifieer in Turso dashboard dat de database bestaat

### "Authentication failed"
- ✅ Token is verlopen - maak een nieuwe aan
- ✅ Token is incorrect gekopieerd - check op spaties/enters

### "Database not found"
- ✅ Check of de database naam in de URL klopt
- ✅ Database misschien verwijderd - maak nieuwe aan

## Kosten

De **gratis tier** is meer dan genoeg voor SJChess:
- **Storage:** 9 GB (een schaakdatabase met duizenden partijen = paar MB)
- **Reads:** 1 miljard per maand (SJChess gebruikt misschien 1000-10000 per dag)
- **Writes:** Onbeperkt in gratis tier

Je zult de limiet **nooit** bereiken voor normaal gebruik! 🚀

## Beveiliging

- ✅ **Deel nooit** je auth token publiekelijk
- ✅ Als je token gelekt is: maak een nieuwe in het Turso dashboard
- ✅ Je kan meerdere tokens maken (1 per computer als je wilt)
- ✅ Tokens kunnen geblokkeerd worden via het dashboard

## Hulp Nodig?

- 📖 Turso Docs: [https://docs.turso.tech](https://docs.turso.tech)
- 💬 Turso Discord: [https://discord.gg/turso](https://discord.gg/turso)
- 📧 Turso Support: [support@turso.tech](mailto:support@turso.tech)

Veel succes met je gedeelde schaaktoernooien! ♟️☁️
