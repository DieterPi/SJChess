import { useState, useEffect } from 'react'
import { useTournament } from '../hooks/useTournament'
import { Shuffle, Trash2, Trophy, Users, UserPlus } from 'lucide-react'
import type { Game, GameResult, Player } from '../types'

export function Games() {
  const { activeTournament } = useTournament()
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set())
  const [showPlayerSelection, setShowPlayerSelection] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadGames = async () => {
    if (!activeTournament) return
    const data = await window.electronAPI.game.getAll(activeTournament.id)
    setGames(data)
  }

  const loadPlayers = async () => {
    if (!activeTournament) return
    const data = await window.electronAPI.player.getAll(activeTournament.id)
    setPlayers(data)
    // Keep existing selection or select all if empty
    if (selectedPlayers.size === 0) {
      setSelectedPlayers(new Set(data.map((p: Player) => p.id)))
    }
  }

  useEffect(() => {
    loadGames()
    loadPlayers()
  }, [activeTournament])

  const handleQuickAddPlayer = async (player: { surname: string; name: string; sex: 'M' | 'F' }) => {
    if (!activeTournament) return
    
    const result = await window.electronAPI.player.create({
      ...player,
      tournamentId: activeTournament.id
    })
    
    // Reload players and auto-select the new player
    await loadPlayers()
    setSelectedPlayers(prev => new Set([...prev, result.id]))
    setShowQuickAdd(false)
  }

  const handleCreatePairings = async () => {
    if (!activeTournament) return
    
    if (selectedPlayers.size === 0) {
      alert('Selecteer minstens één speler om te pairen')
      return
    }
    
    setLoading(true)
    try {
      const result = await window.electronAPI.game.createPairings(
        activeTournament.id,
        Array.from(selectedPlayers)
      )
      alert(`${result.pairingsCreated} nieuwe paringen aangemaakt!`)
      loadGames()
      setShowPlayerSelection(false)
    } catch (error) {
      console.error('Failed to create pairings:', error)
      alert('Fout bij het maken van de paringen')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (playerId: number) => {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const toggleAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set())
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)))
    }
  }

  const handleUpdateResult = async (id: number, result: GameResult) => {
    await window.electronAPI.game.updateResult(id, result)
    loadGames()
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Weet je zeker dat je deze partij wilt verwijderen?')) {
      await window.electronAPI.game.delete(id)
      loadGames()
    }
  }

  const getResultText = (result: GameResult) => {
    switch (result) {
      case 0: return 'Nog te spelen'
      case 1: return '1-0 (Wit wint)'
      case 2: return '½-½ (Remise)'
      case 3: return '0-1 (Zwart wint)'
      default: return '-'
    }
  }

  if (!activeTournament) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Geen actief tornooi</h2>
        <p className="text-gray-600">Selecteer eerst een tornooi op het dashboard.</p>
      </div>
    )
  }

  const groupedByDate = games.reduce((acc, game) => {
    const date = game.date
    if (!acc[date]) acc[date] = []
    acc[date].push(game)
    return acc
  }, {} as Record<string, Game[]>)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Partijen</h1>
        <button
          onClick={() => setShowPlayerSelection(true)}
          disabled={loading}
          className="btn-success"
        >
          <Shuffle className="w-4 h-4 inline mr-2" />
          {loading ? 'Bezig...' : 'Nieuwe ronde pairen'}
        </button>
      </div>

      {/* Player Selection Modal */}
      {showPlayerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Selecteer spelers voor deze ronde
            </h2>
            
            <div className="mb-4 flex justify-between items-center">
              <div>
                <button
                  onClick={toggleAll}
                  className="btn-secondary btn-sm"
                >
                  {selectedPlayers.size === players.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
                <span className="ml-4 text-sm text-gray-600">
                  {selectedPlayers.size} van {players.length} spelers geselecteerd
                </span>
              </div>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="btn-success btn-sm"
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                Snelle toevoeging
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlayers.has(player.id)
                      ? 'bg-primary-50 border-primary-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="ml-3 font-medium">
                    {player.surname} {player.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPlayerSelection(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Annuleren
              </button>
              <button
                onClick={handleCreatePairings}
                className="btn-success"
                disabled={loading || selectedPlayers.size === 0}
              >
                <Shuffle className="w-4 h-4 inline mr-2" />
                {loading ? 'Bezig met pairen...' : `Pairen (${selectedPlayers.size} spelers)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Player Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Speler snel toevoegen
            </h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!activeTournament) return
              
              try {
                const result = await window.electronAPI.player.create({
                  surname: (e.target as any).surname.value,
                  name: (e.target as any).name.value,
                  sex: (e.target as any).sex.value,
                  tournamentId: activeTournament.id
                })
                
                // Reload players and auto-select the new player
                const updatedPlayers = await window.electronAPI.player.getAll(activeTournament.id)
                setPlayers(updatedPlayers)
                setSelectedPlayers(new Set([...selectedPlayers, result.id]))
                
                setShowQuickAdd(false)
                // Reset form
                ;(e.target as any).reset()
              } catch (error) {
                console.error('Failed to add player:', error)
                alert('Fout bij toevoegen speler')
              }
            }}>
              <div className="mb-4">
                <label className="label">Achternaam</label>
                <input
                  name="surname"
                  type="text"
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="label">Voornaam</label>
                <input
                  name="name"
                  type="text"
                  className="input"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="label">Geslacht</label>
                <select name="sex" className="input">
                  <option value="M">Man</option>
                  <option value="F">Vrouw</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button type="submit" className="btn-success">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nog geen partijen. Klik op "Nieuwe ronde pairen" om te beginnen.</p>
        </div>
      ) : (
        Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, dateGames]) => (
          <div key={date} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {new Date(date).toLocaleDateString('nl-BE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Wit</th>
                    <th>Zwart</th>
                    <th>Resultaat</th>
                    <th className="text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {dateGames.map((game) => (
                    <tr key={game.id}>
                      <td className="font-medium">
                        {game.whiteSurname} {game.whiteName}
                      </td>
                      <td className="font-medium">
                        {game.blackPlayerId ? (
                          `${game.blackSurname} ${game.blackName}`
                        ) : (
                          <span className="text-gray-500 italic">Bye</span>
                        )}
                      </td>
                      <td>
                        {game.blackPlayerId ? (
                          <select
                            className="input py-1 text-sm"
                            value={game.result}
                            onChange={(e) => handleUpdateResult(game.id, Number(e.target.value) as GameResult)}
                          >
                            <option value={0}>Nog te spelen</option>
                            <option value={1}>1-0 (Wit wint)</option>
                            <option value={2}>½-½ (Remise)</option>
                            <option value={3}>0-1 (Zwart wint)</option>
                          </select>
                        ) : (
                          <span className="text-orange-600 font-medium">½-½ (Bye - 0.5 punt)</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(game.id)}
                          className="btn-danger btn-sm"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
