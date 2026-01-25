import { useState, useEffect } from 'react'
import { useTournament } from '../hooks/useTournament'
import { Plus, Edit2, Trash2, UserPlus, Users } from 'lucide-react'
import type { Player } from '../types'

export function Players() {
  const { activeTournament } = useTournament()
  const [players, setPlayers] = useState<Player[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  const loadPlayers = async () => {
    if (!activeTournament) return
    const data = await window.electronAPI.player.getAll(activeTournament.id)
    setPlayers(data)
  }

  useEffect(() => {
    loadPlayers()
  }, [activeTournament])

  const handleDelete = async (id: number) => {
    if (window.confirm('Weet je zeker dat je deze speler wilt verwijderen?')) {
      await window.electronAPI.player.delete(id)
      loadPlayers()
    }
  }

  if (!activeTournament) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Geen actief tornooi</h2>
        <p className="text-gray-600">Selecteer eerst een tornooi op het dashboard.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Spelers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-success"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Speler toevoegen
        </button>
      </div>

      <div className="card">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nog geen spelers toegevoegd</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Achternaam</th>
                <th>Voornaam</th>
                <th>Geslacht</th>
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.surname}</td>
                  <td>{player.name}</td>
                  <td>{player.sex === 'M' ? 'Man' : 'Vrouw'}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setEditingPlayer(player)}
                      className="btn-secondary btn-sm mr-2"
                    >
                      <Edit2 className="w-3 h-3 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="btn-danger btn-sm"
                    >
                      <Trash2 className="w-3 h-3 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPlayer) && (
        <PlayerModal
          player={editingPlayer}
          tournamentId={activeTournament.id}
          onClose={() => {
            setShowAddModal(false)
            setEditingPlayer(null)
          }}
          onSave={loadPlayers}
        />
      )}
    </div>
  )
}

interface PlayerModalProps {
  player: Player | null
  tournamentId: number
  onClose: () => void
  onSave: () => void
}

function PlayerModal({ player, tournamentId, onClose, onSave }: PlayerModalProps) {
  const [formData, setFormData] = useState({
    surname: player?.surname || '',
    name: player?.name || '',
    sex: player?.sex || 'M' as 'M' | 'F'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (player) {
      await window.electronAPI.player.update(player.id, formData)
    } else {
      await window.electronAPI.player.create({ ...formData, tournamentId })
    }
    
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {player ? 'Speler bewerken' : 'Nieuwe speler'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Achternaam</label>
            <input
              type="text"
              className="input"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="label">Voornaam</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-6">
            <label className="label">Geslacht</label>
            <select
              className="input"
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'M' | 'F' })}
            >
              <option value="M">Man</option>
              <option value="F">Vrouw</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuleren
            </button>
            <button type="submit" className="btn-success">
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
