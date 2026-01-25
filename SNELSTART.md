# SJChess Modern - Snelstart Gids

## 🚀 Installatie & Eerste Gebruik

### Stap 1: Vereisten
- **Node.js 20+** installeren van https://nodejs.org/

### Stap 2: Project Setup
```bash
# Pak de ZIP uit
unzip sjchess-modern.zip
cd sjchess-modern

# Installeer dependencies
npm install
```

### Stap 3: Ontwikkeling Testen
```bash
npm run electron:dev
```

De applicatie opent in een nieuw venster!

### Stap 4: Production Build Maken

**Voor Windows:**
```bash
npm run build:win
```
➜ Executable in `release/[version]/`

**Voor Linux:**
```bash
npm run build:linux
```
➜ AppImage, .deb en .rpm in `release/[version]/`

**Voor macOS:**
```bash
npm run build:mac
```
➜ DMG en ZIP in `release/[version]/`

## 📦 Wat is er Nieuw?

### Moderne Tech Stack
- ✅ **Electron 33** (was v7) - Veilig & snel
- ✅ **React 18 + TypeScript** - Type-safe ontwikkeling  
- ✅ **Tailwind CSS** - Modern design
- ✅ **Vite** - Razendsnel bouwen
- ✅ **better-sqlite3** - Betere database performance

### Security Verbeteringen
- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Veilige IPC communicatie
- ✅ Geen deprecated modules

### Features
- ✅ Dashboard met statistieken
- ✅ Spelersbeheer met modal dialogen
- ✅ Automatische paring (Swiss system)
- ✅ Live rankings met percentages
- ✅ Partijen per datum gegroepeerd
- ✅ Bye support (automatische winst)

## 🎯 Gebruik

### 1. Tornooi Aanmaken
- Ga naar Dashboard
- Vul een naam in (bijv. "Schoolkampioenschap 2026")
- Klik op "Toevoegen"
- Selecteer het tornooi in de dropdown

### 2. Spelers Toevoegen
- Ga naar "Spelers" in het menu
- Klik op "+ Speler toevoegen"
- Vul naam, voornaam en geslacht in
- Herhaal voor alle spelers

### 3. Eerste Ronde Pairen
- Ga naar "Partijen"
- Klik op "Nieuwe ronde pairen"
- De paring gebeurt automatisch volgens Swiss system

### 4. Resultaten Invoeren
- Bij elke partij kun je het resultaat selecteren:
  - "Nog te spelen"
  - "1-0 (Wit wint)"
  - "½-½ (Remise)"
  - "0-1 (Zwart wint)"

### 5. Ranking Bekijken
- Ga naar "Ranking"
- Zie de live standings met scores en percentages

## 🔄 Data Migreren van Oude Versie

Als je de oude SJChess versie hebt gebruikt:

1. Zoek je oude `sjchess.db` bestand
2. Kopieer het naar:
   - **Windows:** `%APPDATA%/sjchess/`
   - **Linux:** `~/.config/sjchess/`
   - **macOS:** `~/Library/Application Support/sjchess/`
3. Start de nieuwe applicatie - je data is direct beschikbaar!

## 🐛 Problemen Oplossen

### "npm install" faalt
- Zorg dat je Node.js 20+ hebt
- Probeer: `npm cache clean --force` en daarna opnieuw `npm install`

### Build faalt op Linux
- Installeer vereiste packages:
  ```bash
  sudo apt-get install build-essential
  ```

### Electron opent niet
- Check of poort 5173 vrij is
- Probeer: `npm run dev` en bekijk console voor errors

## 📝 Development Tips

### Hot Reload
In dev mode (`npm run electron:dev`) worden wijzigingen automatisch herladen.

### DevTools
In development mode zijn DevTools standaard open. Sluit ze met F12.

### Database Locatie
De database staat in je user data directory. Zie README.md voor exacte paden.

## 🎨 Aanpassingen Maken

### Kleuren Wijzigen
Bewerk `tailwind.config.js`:
```js
colors: {
  primary: {
    // Pas deze waardes aan
  }
}
```

### Nieuwe Pagina Toevoegen
1. Maak bestand in `src/pages/`
2. Voeg route toe in `src/App.tsx`
3. Voeg menu item toe in `src/components/Layout.tsx`

## 📞 Support

Voor vragen of problemen:
- Check de README.md voor gedetailleerde info
- Open een issue op GitHub

Veel succes met je schaaktoernooien! ♟️
