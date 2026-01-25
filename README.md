# SJChess Tournament Manager

Modern chess tournament pairing application for secondary schools, built with Electron, React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Tournament Management**: Create and manage multiple tournaments
- ✅ **Player Management**: Add, edit, and remove players
- ✅ **Automatic Pairing**: Intelligent Swiss-system pairing engine
- ✅ **Game Results**: Track and update game results
- ✅ **Live Rankings**: Real-time tournament standings
- ✅ **Modern UI**: Clean, responsive interface with Tailwind CSS
- ✅ **Cross-platform**: Works on Windows, Linux, and macOS
- ✅ **Secure**: Modern Electron security with context isolation
- ✅ **Fast**: Built with Vite for lightning-fast development and builds

## Technology Stack

- **Electron 33+**: Cross-platform desktop framework
- **React 18**: Modern UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **better-sqlite3**: Fast, synchronous SQLite database
- **Lucide React**: Beautiful icon library

## Installation

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/DieterPi/SJChess.git
cd sjchess-modern
```

2. Install dependencies:
```bash
npm install
```

3. Start development mode:
```bash
npm run electron:dev
```

## Building

### Build for your current platform:
```bash
npm run build
```

### Build for specific platforms:

**Windows:**
```bash
npm run build:win
```

**Linux:**
```bash
npm run build:linux
```

**macOS:**
```bash
npm run build:mac
```

Built applications will be in the `release/[version]` directory.

### Available Build Targets

- **Windows**: NSIS installer and portable executable
- **Linux**: AppImage, .deb, and .rpm packages
- **macOS**: DMG and ZIP

## Development

### Project Structure

```
sjchess-modern/
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   ├── preload.ts    # Preload script for IPC
│   └── database.ts   # Database initialization
├── src/              # React frontend
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript definitions
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Frontend entry point
├── build/            # Build assets (icons)
└── dist/             # Production build output
```

### Development Scripts

- `npm run dev` - Start Vite dev server only
- `npm run electron:dev` - Start full Electron app in dev mode
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Security Features

This application implements modern Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Secure IPC communication via preload script
- ✅ No remote module usage
- ✅ Content Security Policy ready

## Database

The application uses SQLite (via better-sqlite3) for data storage. The database file is stored in the user's application data directory:

- **Windows**: `%APPDATA%/sjchess/sjchess.db`
- **Linux**: `~/.config/sjchess/sjchess.db`
- **macOS**: `~/Library/Application Support/sjchess/sjchess.db`

### Database Schema

**tournaments**
- id (PRIMARY KEY)
- name
- date
- active (BOOLEAN)
- ts (timestamp)

**players**
- id (PRIMARY KEY)
- surname
- name
- sex ('M' or 'F')
- tournamentId (FOREIGN KEY)

**games**
- id (PRIMARY KEY)
- whitePlayerId (FOREIGN KEY)
- blackPlayerId (FOREIGN KEY, nullable)
- result (0=not played, 1=white wins, 2=draw, 3=black wins)
- date
- ts (timestamp)

## Pairing Algorithm

The application uses a Swiss-system pairing algorithm:

1. Players are sorted by score (descending) and games played (ascending)
2. Players with equal scores are randomly shuffled
3. Pairing starts from the top of the sorted list
4. Each player is paired with the highest-ranked unpaired player they haven't faced
5. Color assignment is based on balancing white/black games
6. If no opponent is available, a bye (automatic win) is assigned

## Upgrading from Old Version

If you have data from the old SJChess version:

1. Locate your old database file (`sjchess.db`)
2. Copy it to the new application's data directory (see Database section above)
3. The database schema is compatible - your data will work immediately!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GNU General Public License v3.0 - see LICENSE file for details

## Author

Dieter Vanderfaeillie

## Changelog

### Version 1.0.0 (2026)
- Complete rewrite with modern tech stack
- Electron 33+ with modern security
- React 18 + TypeScript
- Tailwind CSS styling
- Improved pairing algorithm
- Better performance with better-sqlite3
- Cross-platform builds for Windows, Linux, and macOS
