export interface Tournament {
  id: number
  name: string
  date: string
  ts: string
  active: boolean
}

export interface Player {
  id: number
  surname: string
  name: string
  sex: 'M' | 'F'
  tournamentId: number
}

export interface Game {
  id: number
  whitePlayerId: number
  blackPlayerId?: number
  result: GameResult
  date: string
  ts: string
  whiteSurname?: string
  whiteName?: string
  blackSurname?: string
  blackName?: string
}

export enum GameResult {
  NotPlayed = 0,
  WhiteWins = 1,
  Draw = 2,
  BlackWins = 3
}

export interface PlayerStats {
  id: number
  player: Player
  score: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
}

export interface TournamentStats {
  playerCount: number
  gameCount: number
}
