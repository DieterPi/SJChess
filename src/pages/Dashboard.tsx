import { useState, useEffect } from 'react'
import { useTournament } from '../hooks/useTournament'
import { Plus, Trash2, Users, Trophy } from 'lucide-react'
import type { TournamentStats } from '../types'

export function Dashboard() {
  const { tournaments, activeTournament, createTournament, setActive, deleteTournament } = useTournament()
  const [newTournamentName, setNewTournamentName] = useState('')
  const [stats, setStats] = useState<TournamentStats | null>(null)

  useEffect(() => {
    if (activeTournament) {
      window.electronAPI.tournament.getStats(activeTournament.id)
        .then(setStats)
        .catch(console.error)
    }
  }, [activeTournament])

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTournamentName.trim()) {
      await createTournament(newTournamentName.trim())
      setNewTournamentName('')
    }
  }

  const handleDeleteTournament = async () => {
    if (!activeTournament) return
    
    if (window.confirm(`Weet je zeker dat je "${activeTournament.name}" wilt verwijderen? Alle spelers en partijen worden ook verwijderd.`)) {
      await deleteTournament(activeTournament.id)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Active Tournament Info */}
      {activeTournament && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actief Tornooi</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">{activeTournament.name}</h2>
              </div>
              <Trophy className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Spelers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.playerCount}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Partijen</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.gameCount}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Selection */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Kies het actieve tornooi</h2>
        
        <select
          className="input mb-4"
          value={activeTournament?.id || ''}
          onChange={(e) => setActive(Number(e.target.value))}
        >
          <option value="">Selecteer een tornooi...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} ({new Date(tournament.date).toLocaleDateString('nl-BE')})
            </option>
          ))}
        </select>

        {activeTournament && (
          <button
            onClick={handleDeleteTournament}
            className="btn-danger btn-sm"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Verwijderen
          </button>
        )}
      </div>

      {/* Create New Tournament */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Nieuw tornooi aanmaken</h2>
        
        <form onSubmit={handleCreateTournament}>
          <div className="mb-4">
            <label className="label">Naam van het tornooi</label>
            <input
              type="text"
              className="input"
              placeholder="Bijv. Schoolkampioenschap 2026"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
            />
          </div>
          
          <button type="submit" className="btn-success">
            <Plus className="w-4 h-4 inline mr-2" />
            Toevoegen
          </button>
        </form>
      </div>
    </div>
  )
}
