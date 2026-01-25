# Supabase Database Setup Gids

## Waarom Supabase?

Supabase is **sneller** dan Turso omdat het:
- ✅ **Direct TCP verbinding** gebruikt (niet HTTP zoals Turso)
- ✅ **PostgreSQL** - zeer geoptimaliseerde database
- ✅ **Edge servers** wereldwijd
- ✅ **Gratis tier:** 500 MB database, geen credit card
- ✅ **Real-time:** Updates verschijnen direct bij iedereen

## Stap 1: Account Aanmaken

1. Ga naar [https://supabase.com](https://supabase.com)
2. Klik op "Start your project"
3. Maak een account aan (via GitHub is makkelijkst)
4. Bevestig je email adres

## Stap 2: Project Aanmaken

1. Klik op "+ New project"
2. Vul in:
   - **Name:** `sjchess` (of een andere naam)
   - **Database Password:** Kies een sterk wachtwoord (bewaar dit!)
   - **Region:** Kies dichtstbijzijnde regio (bijv. West EU - Belgium)
3. Klik "Create new project"
4. Wacht ~2 minuten terwijl je database wordt opgezet

## Stap 3: Credentials Ophalen

1. In je project dashboard, ga naar **Settings** (tandwiel icoon linksonder)
2. Klik op **API**
3. Kopieer:
   - **Project URL** (bijv. `https://xxxxx.supabase.co`)
   - **anon public** key (lange string onder "Project API keys")

⚠️ **Gebruik NIET de service_role key** - die is te krachtig!

## Stap 4: Database Tabellen Aanmaken

Supabase maakt de tabellen niet automatisch aan. Je moet ze handmatig aanmaken:

### Via SQL Editor:

1. In je Supabase dashboard, ga naar **SQL Editor** (icoon links)
2. Klik "+ New query"
3. Plak deze SQL:

```sql
-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  date DATE NOT NULL,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT false
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  surname VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  sex CHAR(1) NOT NULL,
  "tournamentId" INTEGER NOT NULL,
  FOREIGN KEY ("tournamentId") REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  "whitePlayerId" INTEGER NOT NULL,
  "blackPlayerId" INTEGER,
  result INTEGER DEFAULT 0,
  date DATE NOT NULL,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("whitePlayerId") REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY ("blackPlayerId") REFERENCES players(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players("tournamentId");
CREATE INDEX IF NOT EXISTS idx_games_white ON games("whitePlayerId");
CREATE INDEX IF NOT EXISTS idx_games_black ON games("blackPlayerId");
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);

-- Enable Row Level Security (RLS) - BELANGRIJK voor beveiliging
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policies: iedereen mag alles (voor schoolgebruik)
-- Voor productie zou je hier strengere policies willen!
CREATE POLICY "Enable all for tournaments" ON tournaments FOR ALL USING (true);
CREATE POLICY "Enable all for players" ON players FOR ALL USING (true);
CREATE POLICY "Enable all for games" ON games FOR ALL USING (true);
```

4. Klik "Run" (of druk Ctrl+Enter)
5. Je zou "Success. No rows returned" moeten zien

### Verificatie:

1. Ga naar **Table Editor** (links in menu)
2. Je zou nu moeten zien: `tournaments`, `players`, `games`

## Stap 5: In SJChess Configureren

1. Open SJChess
2. Ga naar **Instellingen**
3. Selecteer **"Supabase Database"**
4. Plak je **Project URL**
5. Plak je **anon public key**
6. Klik **"Opslaan"**
7. **Herstart** de applicatie

## Stap 6: Testen

1. Start SJChess
2. Maak een test tornooi aan
3. Laat je collega ook inloggen (met dezelfde credentials)
4. Jullie zouden dezelfde data moeten zien! 🎉

## Performance Tips

### Voor maximale snelheid:

1. **Kies de juiste regio:** Zo dicht mogelijk bij je locatie
2. **Gebruik indexes:** De bovenstaande SQL bevat al de juiste indexes
3. **Cache lokaal:** Supabase heeft automatisch caching

### Snelheidstest:
- **Lokaal:** ~1-5ms queries
- **Supabase:** ~20-100ms queries (afhankelijk van je internet)
- **Turso:** ~100-300ms queries

## Beveiliging

### Row Level Security (RLS):

De bovenstaande SQL heeft RLS ingeschakeld maar **iedereen mag alles**. Dit is OK voor schoolgebruik, maar voor productie zou je dit willen aanpassen:

```sql
-- Voorbeeld: alleen authenticated users
DROP POLICY IF EXISTS "Enable all for tournaments" ON tournaments;
CREATE POLICY "Authenticated can do all" ON tournaments 
  FOR ALL 
  USING (auth.role() = 'authenticated');
```

Voor schoolgebruik is de simpele policy voldoende.

## Kosten

**Gratis tier:**
- 500 MB database (genoeg voor duizenden partijen)
- 2 GB bandwidth per maand
- 50.000 monthly active users

Voor SJChess gebruik kom je **nooit** aan de limieten! 🚀

## Troubleshooting

### "Failed to connect"
- ✅ Check internet verbinding
- ✅ Verifieer URL en key (geen extra spaties)
- ✅ Check of project actief is in Supabase dashboard

### "relation does not exist"
- ✅ Tabellen niet aangemaakt - volg Stap 4 opnieuw
- ✅ Verkeerde tabel namen - kopieer exact de SQL

### "permission denied"
- ✅ RLS policies niet correct - volg Stap 4 opnieuw
- ✅ Gebruik anon key, NIET service_role key

### "Insert failed"
- ✅ Foreign key violations - check of tournament/player bestaat
- ✅ Data type mismatch - check SQL types

## Data Migreren

### Van lokaal naar Supabase:

**Handmatig (klein dataset):**
- Voer data opnieuw in terwijl verbonden met Supabase

**Via export/import (groot dataset):**
1. Exporteer lokale database naar SQL:
   ```bash
   sqlite3 sjchess.db .dump > export.sql
   ```
2. Converteer SQLite SQL naar PostgreSQL (handmatig of met tool)
3. Importeer via Supabase SQL Editor

## Hulp Nodig?

- 📖 Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- 💬 Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
- 📧 Support: via Supabase dashboard

Veel succes met je snelle cloud database! ⚡️
