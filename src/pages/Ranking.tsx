import { useState, useEffect } from 'react'
import { useTournament } from '../hooks/useTournament'
import { Trophy, Medal, Award } from 'lucide-react'
import type { Player, Game, PlayerStats } from '../types'

export function Ranking() {
  const { activeTournament } = useTournament()
  const [ranking, setRanking] = useState<PlayerStats[]>([])

  useEffect(() => {
    loadRanking()
  }, [activeTournament])

  const loadRanking = async () => {
    if (!activeTournament) return

    const [players, games] = await Promise.all([
      window.electronAPI.player.getAll(activeTournament.id),
      window.electronAPI.game.getAll(activeTournament.id)
    ])

    const stats: PlayerStats[] = players.map((player: Player) => {
      let score = 0
      let gamesPlayed = 0
      let wins = 0
      let draws = 0
      let losses = 0

      games.forEach((game: Game) => {
        if (game.whitePlayerId === player.id) {
          gamesPlayed++
          if (game.result === 1) { // White wins
            score += 1
            wins++
          } else if (game.result === 2) { // Draw
            score += 0.5
            draws++
          } else if (game.result === 3) { // Black wins
            losses++
          }
          // If result is 0 (not played) and it's a bye, count as win
          if (!game.blackPlayerId && game.result === 0) {
            score += 1
            wins++
          }
        } else if (game.blackPlayerId === player.id) {
          gamesPlayed++
          if (game.result === 3) { // Black wins
            score += 1
            wins++
          } else if (game.result === 2) { // Draw
            score += 0.5
            draws++
          } else if (game.result === 1) { // White wins
            losses++
          }
        }
      })

      return {
        id: player.id,
        player,
        score,
        gamesPlayed,
        wins,
        draws,
        losses
      }
    })

    // Sort by score (descending), then by games played (ascending)
    stats.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      return a.gamesPlayed - b.gamesPlayed
    })

    setRanking(stats)
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-orange-600" />
    return null
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ranking</h1>

      {ranking.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nog geen partijen gespeeld</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th className="w-16">Rang</th>
                <th>Speler</th>
                <th className="text-center">Partijen</th>
                <th className="text-center">Winst</th>
                <th className="text-center">Remise</th>
                <th className="text-center">Verlies</th>
                <th className="text-center">Score</th>
                <th className="text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((stat, index) => {
                const percentage = stat.gamesPlayed > 0 
                  ? ((stat.score / stat.gamesPlayed) * 100).toFixed(1) 
                  : '0.0'
                
                return (
                  <tr key={stat.id} className={index < 3 ? 'bg-primary-50' : ''}>
                    <td className="font-bold text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getRankIcon(index)}
                        <span>{index + 1}</span>
                      </div>
                    </td>
                    <td className="font-medium">
                      {stat.player.surname} {stat.player.name}
                    </td>
                    <td className="text-center">{stat.gamesPlayed}</td>
                    <td className="text-center text-green-600 font-medium">{stat.wins}</td>
                    <td className="text-center text-gray-600">{stat.draws}</td>
                    <td className="text-center text-red-600">{stat.losses}</td>
                    <td className="text-center font-bold text-lg">{stat.score}</td>
                    <td className="text-center text-gray-600">{percentage}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
