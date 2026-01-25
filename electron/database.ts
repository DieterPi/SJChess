import Database from 'better-sqlite3'
import { createClient, type Client } from '@libsql/client/web'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null
let tursoClient: Client | null = null
let supabaseClient: SupabaseClient | null = null
let dbMode: 'local' | 'turso' | 'supabase' = 'local'

const CONFIG_FILE = 'db-config.json'

interface DbConfig {
  mode: 'local' | 'turso' | 'supabase'
  tursoUrl?: string
  tursoAuthToken?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

export function loadConfig(userDataPath: string): DbConfig {
  const configPath = path.join(userDataPath, CONFIG_FILE)
  
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }
  
  return { mode: 'local' }
}

export function saveConfig(userDataPath: string, config: DbConfig): void {
  const configPath = path.join(userDataPath, CONFIG_FILE)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

export async function initDatabase(userDataPath: string): Promise<void> {
  const config = loadConfig(userDataPath)
  dbMode = config.mode
  
  if (config.mode === 'turso' && config.tursoUrl && config.tursoAuthToken) {
    await initTurso(config.tursoUrl, config.tursoAuthToken)
  } else if (config.mode === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
    await initSupabase(config.supabaseUrl, config.supabaseAnonKey)
  } else {
    initLocal(userDataPath)
  }
}

function initLocal(userDataPath: string): void {
  const dbPath = path.join(userDataPath, 'sjchess.db')
  
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  createTables()
}

async function initTurso(url: string, authToken: string): Promise<void> {
  tursoClient = createClient({ url, authToken })
  await createTablesTurso()
}

async function initSupabase(url: string, anonKey: string): Promise<void> {
  supabaseClient = createSupabaseClient(url, anonKey)
  await createTablesSupabase()
}

function createTables(): void {
  if (!db) return
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(128) NOT NULL,
      date DATE NOT NULL,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      active BOOLEAN DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surname VARCHAR(128) NOT NULL,
      name VARCHAR(128) NOT NULL,
      sex CHAR(1) NOT NULL,
      tournamentId INTEGER NOT NULL,
      FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
    );
    
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whitePlayerId INTEGER NOT NULL,
      blackPlayerId INTEGER,
      result INTEGER DEFAULT 0,
      date DATE NOT NULL,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (whitePlayerId) REFERENCES players(id),
      FOREIGN KEY (blackPlayerId) REFERENCES players(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournamentId);
    CREATE INDEX IF NOT EXISTS idx_games_white ON games(whitePlayerId);
    CREATE INDEX IF NOT EXISTS idx_games_black ON games(blackPlayerId);
    CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
  `)
}

async function createTablesTurso(): Promise<void> {
  if (!tursoClient) return
  
  const statements = [
    `CREATE TABLE IF NOT EXISTS tournaments (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(128) NOT NULL, date DATE NOT NULL, ts DATETIME DEFAULT CURRENT_TIMESTAMP, active BOOLEAN DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, surname VARCHAR(128) NOT NULL, name VARCHAR(128) NOT NULL, sex CHAR(1) NOT NULL, tournamentId INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, whitePlayerId INTEGER NOT NULL, blackPlayerId INTEGER, result INTEGER DEFAULT 0, date DATE NOT NULL, ts DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournamentId)`,
    `CREATE INDEX IF NOT EXISTS idx_games_white ON games(whitePlayerId)`,
    `CREATE INDEX IF NOT EXISTS idx_games_black ON games(blackPlayerId)`,
    `CREATE INDEX IF NOT EXISTS idx_games_date ON games(date)`
  ]
  
  for (const stmt of statements) {
    try {
      await tursoClient.execute(stmt)
    } catch (error) {
      // Ignore errors (table/index might exist)
    }
  }
}

async function createTablesSupabase(): Promise<void> {
  if (!supabaseClient) return
  
  // Check if tables exist first
  const { data: existingTables } = await supabaseClient
    .from('tournaments')
    .select('id')
    .limit(1)
  
  // If tournaments table doesn't exist, create all tables
  // Note: In production Supabase, you'd typically create tables via the dashboard or migrations
  // This is a simplified approach - you may need to create tables manually in Supabase dashboard
  console.log('Supabase connected. Please ensure tables are created in Supabase dashboard if needed.')
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Local database not initialized')
  }
  return db
}

export function getTursoClient(): Client {
  if (!tursoClient) {
    throw new Error('Turso client not initialized')
  }
  return tursoClient
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized')
  }
  return supabaseClient
}

export function getDbMode(): 'local' | 'turso' | 'supabase' {
  return dbMode
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
  tursoClient = null
  supabaseClient = null
}
