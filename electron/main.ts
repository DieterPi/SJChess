import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, loadConfig, saveConfig } from './database'
import { executeQuery, executeQueryFirst, executeRun } from './db-helpers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    mainWindow.setMenu(null)  // <-- VOEG DEZE REGEL TOE
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(async () => {
  await initDatabase(app.getPath('userData'))
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Database config handlers
ipcMain.handle('db:getConfig', async () => {
  return loadConfig(app.getPath('userData'))
})

ipcMain.handle('db:setConfig', async (_event, config) => {
  saveConfig(app.getPath('userData'), config)
  await initDatabase(app.getPath('userData'))
  return { success: true }
})

// Tournament operations
ipcMain.handle('tournament:getAll', async () => {
  return await executeQuery('SELECT * FROM tournaments ORDER BY date DESC')
})

ipcMain.handle('tournament:getActive', async () => {
  return await executeQueryFirst('SELECT * FROM tournaments WHERE active = 1')
})

ipcMain.handle('tournament:create', async (_event, name: string) => {
  const result = await executeRun(
    "INSERT INTO tournaments (name, date, active) VALUES (?, datetime('now'), 0)",
    [name]
  )
  return { id: result.lastInsertRowid }
})

ipcMain.handle('tournament:setActive', async (_event, id: number) => {
  await executeRun('UPDATE tournaments SET active = 0')
  await executeRun('UPDATE tournaments SET active = 1 WHERE id = ?', [id])
  return { success: true }
})

ipcMain.handle('tournament:delete', async (_event, id: number) => {
  await executeRun('DELETE FROM games WHERE whitePlayerId IN (SELECT id FROM players WHERE tournamentId = ?)', [id])
  await executeRun('DELETE FROM players WHERE tournamentId = ?', [id])
  await executeRun('DELETE FROM tournaments WHERE id = ?', [id])
  return { success: true }
})

// Player operations
ipcMain.handle('player:getAll', async (_event, tournamentId: number) => {
  return await executeQuery('SELECT * FROM players WHERE tournamentId = ? ORDER BY surname, name', [tournamentId])
})

ipcMain.handle('player:create', async (_event, player: { surname: string; name: string; sex: string; tournamentId: number }) => {
  const result = await executeRun(
    'INSERT INTO players (surname, name, sex, tournamentId) VALUES (?, ?, ?, ?)',
    [player.surname, player.name, player.sex, player.tournamentId]
  )
  return { id: result.lastInsertRowid }
})

ipcMain.handle('player:update', async (_event, id: number, player: { surname: string; name: string; sex: string }) => {
  await executeRun('UPDATE players SET surname = ?, name = ?, sex = ? WHERE id = ?',
    [player.surname, player.name, player.sex, id])
  return { success: true }
})

ipcMain.handle('player:delete', async (_event, id: number) => {
  await executeRun('DELETE FROM games WHERE whitePlayerId = ? OR blackPlayerId = ?', [id, id])
  await executeRun('DELETE FROM players WHERE id = ?', [id])
  return { success: true }
})

// Game operations
ipcMain.handle('game:getAll', async (_event, tournamentId: number) => {
  return await executeQuery(`
    SELECT g.*, 
           wp.surname as whiteSurname, wp.name as whiteName,
           bp.surname as blackSurname, bp.name as blackName
    FROM games g
    JOIN players wp ON g.whitePlayerId = wp.id
    LEFT JOIN players bp ON g.blackPlayerId = bp.id
    WHERE wp.tournamentId = ?
    ORDER BY g.date DESC, g.id DESC
  `, [tournamentId])
})

ipcMain.handle('game:create', async (_event, game: { whitePlayerId: number; blackPlayerId?: number; date: string }) => {
  const result = await executeRun(
    'INSERT INTO games (whitePlayerId, blackPlayerId, result, date) VALUES (?, ?, 0, ?)',
    [game.whitePlayerId, game.blackPlayerId || null, game.date]
  )
  return { id: result.lastInsertRowid }
})

ipcMain.handle('game:updateResult', async (_event, id: number, result: number) => {
  await executeRun('UPDATE games SET result = ? WHERE id = ?', [result, id])
  return { success: true }
})

ipcMain.handle('game:delete', async (_event, id: number) => {
  await executeRun('DELETE FROM games WHERE id = ?', [id])
  return { success: true }
})

// Get tournament stats
ipcMain.handle('tournament:getStats', async (_event, tournamentId: number) => {
  const players = await executeQueryFirst('SELECT COUNT(*) as count FROM players WHERE tournamentId = ?', [tournamentId])
  const games = await executeQueryFirst(`
    SELECT COUNT(*) as count FROM games g
    JOIN players p ON g.whitePlayerId = p.id
    WHERE p.tournamentId = ?
  `, [tournamentId])
  
  return {
    playerCount: players.count,
    gameCount: games.count
  }
})

// Pairing engine
ipcMain.handle('game:createPairings', async (_event, tournamentId: number, selectedPlayerIds?: number[]) => {
  let players
  
  if (selectedPlayerIds && selectedPlayerIds.length > 0) {
    // Only use selected players - don't query database, just use the IDs
    players = selectedPlayerIds.map(id => ({ id }))
  } else {
    // Get all players if none selected
    players = await executeQuery('SELECT id FROM players WHERE tournamentId = ?', [tournamentId])
  }
  const games = await executeQuery(`
    SELECT g.* FROM games g
    JOIN players p ON g.whitePlayerId = p.id
    WHERE p.tournamentId = ?
  `, [tournamentId])
  
  // Calculate scores and stats for each player
  const playerStats = players.map((p: any) => {
    let score = 0
    let gamesPlayed = 0
    let whiteGames = 0
    const opponents: number[] = []
    
    games.forEach((game: any) => {
      if (game.whitePlayerId === p.id) {
        gamesPlayed++
        whiteGames++
        if (game.blackPlayerId) opponents.push(game.blackPlayerId)
        if (game.result === 1) score += 1
        if (game.result === 2) score += 0.5
      } else if (game.blackPlayerId === p.id) {
        gamesPlayed++
        opponents.push(game.whitePlayerId)
        if (game.result === 3) score += 1
        if (game.result === 2) score += 0.5
      }
    })
    
    return {
      id: p.id,
      score,
      gamesPlayed,
      whiteGames,
      opponents,
      averageScore: gamesPlayed > 0 ? score / gamesPlayed : 0
    }
  })
  
  playerStats.sort((a: any, b: any) => {
    if (a.score !== b.score) return b.score - a.score
    return a.gamesPlayed - b.gamesPlayed
  })
  
  const shuffledStats = [...playerStats]
  for (let i = 0; i < shuffledStats.length - 1; i++) {
    for (let j = i + 1; j < shuffledStats.length; j++) {
      if (shuffledStats[i].score === shuffledStats[j].score && 
          shuffledStats[i].gamesPlayed === shuffledStats[j].gamesPlayed) {
        if (Math.random() > 0.5) {
          [shuffledStats[i], shuffledStats[j]] = [shuffledStats[j], shuffledStats[i]]
        }
      }
    }
  }
  
  const availablePlayers = [...shuffledStats]
  const newGames: Array<{ whitePlayerId: number; blackPlayerId: number | null }> = []
  
  while (availablePlayers.length >= 2) {
    const player1 = availablePlayers[0]
    let paired = false
    
    for (let i = 1; i < availablePlayers.length; i++) {
      const player2 = availablePlayers[i]
      
      if (!player1.opponents.includes(player2.id)) {
        let whiteId, blackId
        if (player1.whiteGames <= player2.whiteGames) {
          whiteId = player1.id
          blackId = player2.id
        } else {
          whiteId = player2.id
          blackId = player1.id
        }
        
        newGames.push({ whitePlayerId: whiteId, blackPlayerId: blackId })
        
        availablePlayers.splice(i, 1)
        availablePlayers.splice(0, 1)
        paired = true
        break
      }
    }
    
    if (!paired) {
      newGames.push({ whitePlayerId: player1.id, blackPlayerId: null })
      availablePlayers.splice(0, 1)
    }
  }
  
  if (availablePlayers.length === 1) {
    newGames.push({ whitePlayerId: availablePlayers[0].id, blackPlayerId: null })
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  for (const game of newGames) {
    // Bye games (blackPlayerId is null) get result 2 (draw = 0.5 points)
    // Regular games get result 0 (not yet played)
    const result = game.blackPlayerId ? 0 : 2
    
    await executeRun(
      'INSERT INTO games (whitePlayerId, blackPlayerId, result, date) VALUES (?, ?, ?, ?)',
      [game.whitePlayerId, game.blackPlayerId || null, result, today]
    )
  }
  
  return { success: true, pairingsCreated: newGames.length }
})
