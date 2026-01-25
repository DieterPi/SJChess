import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database config
  db: {
    getConfig: () => ipcRenderer.invoke('db:getConfig'),
    setConfig: (config: any) => ipcRenderer.invoke('db:setConfig', config)
  },
  
  // Tournament operations
  tournament: {
    getAll: () => ipcRenderer.invoke('tournament:getAll'),
    getActive: () => ipcRenderer.invoke('tournament:getActive'),
    create: (name: string) => ipcRenderer.invoke('tournament:create', name),
    setActive: (id: number) => ipcRenderer.invoke('tournament:setActive', id),
    delete: (id: number) => ipcRenderer.invoke('tournament:delete', id),
    getStats: (id: number) => ipcRenderer.invoke('tournament:getStats', id)
  },
  
  // Player operations
  player: {
    getAll: (tournamentId: number) => ipcRenderer.invoke('player:getAll', tournamentId),
    create: (player: { surname: string; name: string; sex: string; tournamentId: number }) => 
      ipcRenderer.invoke('player:create', player),
    update: (id: number, player: { surname: string; name: string; sex: string }) => 
      ipcRenderer.invoke('player:update', id, player),
    delete: (id: number) => ipcRenderer.invoke('player:delete', id)
  },
  
  // Game operations
  game: {
    getAll: (tournamentId: number) => ipcRenderer.invoke('game:getAll', tournamentId),
    create: (game: { whitePlayerId: number; blackPlayerId?: number; date: string }) => 
      ipcRenderer.invoke('game:create', game),
    updateResult: (id: number, result: number) => ipcRenderer.invoke('game:updateResult', id, result),
    delete: (id: number) => ipcRenderer.invoke('game:delete', id),
    createPairings: (tournamentId: number, selectedPlayerIds?: number[]) => 
      ipcRenderer.invoke('game:createPairings', tournamentId, selectedPlayerIds)
  }
})

export type ElectronAPI = {
  db: {
    getConfig: () => Promise<any>
    setConfig: (config: any) => Promise<{ success: boolean }>
  }
  tournament: {
    getAll: () => Promise<any[]>
    getActive: () => Promise<any>
    create: (name: string) => Promise<{ id: number }>
    setActive: (id: number) => Promise<{ success: boolean }>
    delete: (id: number) => Promise<{ success: boolean }>
    getStats: (id: number) => Promise<{ playerCount: number; gameCount: number }>
  }
  player: {
    getAll: (tournamentId: number) => Promise<any[]>
    create: (player: any) => Promise<{ id: number }>
    update: (id: number, player: any) => Promise<{ success: boolean }>
    delete: (id: number) => Promise<{ success: boolean }>
  }
  game: {
    getAll: (tournamentId: number) => Promise<any[]>
    create: (game: any) => Promise<{ id: number }>
    updateResult: (id: number, result: number) => Promise<{ success: boolean }>
    delete: (id: number) => Promise<{ success: boolean }>
    createPairings: (tournamentId: number, selectedPlayerIds?: number[]) => Promise<{ success: boolean; pairingsCreated: number }>
  }
}
