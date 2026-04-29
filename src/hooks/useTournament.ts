import { useState, useEffect, useCallback } from 'react'
import type { Tournament } from '../types'

export function useTournament() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTournaments = useCallback(async () => {
    try {
      const [allTournaments, active] = await Promise.all([
        window.electronAPI.tournament.getAll(),
        window.electronAPI.tournament.getActive()
      ])
      setTournaments(allTournaments)
      setActiveTournament(active || null)
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const createTournament = async (data: string | { name: string; type?: string }) => {
    const result = await window.electronAPI.tournament.create(data)
    await loadTournaments()
    return result
  }

  const setActive = async (id: number) => {
    await window.electronAPI.tournament.setActive(id)
    await loadTournaments()
  }

  const deleteTournament = async (id: number) => {
    await window.electronAPI.tournament.delete(id)
    await loadTournaments()
  }

  return {
    tournaments,
    activeTournament,
    loading,
    createTournament,
    setActive,
    deleteTournament,
    refresh: loadTournaments
  }
}
