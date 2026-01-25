import { getDb, getTursoClient, getSupabaseClient, getDbMode } from './database'

export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const mode = getDbMode()
  
  if (mode === 'local') {
    const db = getDb()
    return db.prepare(sql).all(...params)
  } else if (mode === 'turso') {
    const client = getTursoClient()
    const result = await client.execute({ sql, args: params })
    return result.rows
  } else {
    const client = getSupabaseClient()
    return await executeSupabaseSelect(client, sql, params)
  }
}

export async function executeQueryFirst(sql: string, params: any[] = []): Promise<any> {
  const mode = getDbMode()
  
  if (mode === 'local') {
    const db = getDb()
    return db.prepare(sql).get(...params)
  } else if (mode === 'turso') {
    const client = getTursoClient()
    const result = await client.execute({ sql, args: params })
    return result.rows[0] || null
  } else {
    const results = await executeQuery(sql, params)
    return results[0] || null
  }
}

export async function executeRun(sql: string, params: any[] = []): Promise<{ lastInsertRowid?: number }> {
  const mode = getDbMode()
  
  if (mode === 'local') {
    const db = getDb()
    const result = db.prepare(sql).run(...params)
    return { lastInsertRowid: Number(result.lastInsertRowid) }
  } else if (mode === 'turso') {
    const client = getTursoClient()
    const result = await client.execute({ sql, args: params })
    return { lastInsertRowid: Number(result.lastInsertRowid) }
  } else {
    const client = getSupabaseClient()
    
    if (sql.toLowerCase().includes('insert')) {
      return await executeSupabaseInsert(client, sql, params)
    } else if (sql.toLowerCase().includes('update')) {
      return await executeSupabaseUpdate(client, sql, params)
    } else if (sql.toLowerCase().includes('delete')) {
      return await executeSupabaseDelete(client, sql, params)
    }
    
    return {}
  }
}

async function executeSupabaseSelect(client: any, sql: string, params: any[]): Promise<any[]> {
  try {
    // Handle COUNT queries
    if (sql.includes('COUNT(*)')) {
      return await executeSupabaseCount(client, sql, params)
    }
    
    // Handle JOINs
    if (sql.toLowerCase().includes('join')) {
      return await executeSupabaseJoin(client, sql, params)
    }
    
    const tableName = extractTableName(sql)
    let query = client.from(tableName).select('*')
    
    if (sql.toLowerCase().includes('where')) {
      query = applyWhereClause(query, sql, params)
    }
    
    if (sql.toLowerCase().includes('order by')) {
      const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i)
      if (orderMatch) {
        const column = orderMatch[1]
        const ascending = !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc'
        query = query.order(column, { ascending })
      }
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase SELECT error:', error)
      throw new Error(error.message)
    }
    
    return data || []
  } catch (error: any) {
    console.error('Supabase query error:', error)
    throw error
  }
}

async function executeSupabaseCount(client: any, sql: string, params: any[]): Promise<any[]> {
  try {
    const tableName = extractTableName(sql)
    const tournamentId = params[0]
    
    if (tableName === 'players') {
      const { count, error } = await client
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('tournamentId', tournamentId)
      
      if (error) throw new Error(error.message)
      return [{ count: count || 0 }]
    }
    
    if (sql.includes('games g') && sql.includes('JOIN players')) {
      const { data: players, error: playersError } = await client
        .from('players')
        .select('id')
        .eq('tournamentId', tournamentId)
      
      if (playersError) throw new Error(playersError.message)
      
      const playerIds = players?.map((p: any) => p.id) || []
      
      if (playerIds.length === 0) {
        return [{ count: 0 }]
      }
      
      const { count, error } = await client
        .from('games')
        .select('*', { count: 'exact', head: true })
        .in('whitePlayerId', playerIds)
      
      if (error) throw new Error(error.message)
      return [{ count: count || 0 }]
    }
    
    return [{ count: 0 }]
  } catch (error: any) {
    console.error('Supabase COUNT error:', error)
    return [{ count: 0 }]
  }
}

async function executeSupabaseInsert(client: any, sql: string, params: any[]): Promise<{ lastInsertRowid?: number }> {
  try {
    const tableName = extractTableName(sql)
    const data = extractInsertData(sql, params)
    
    const { data: result, error } = await client
      .from(tableName)
      .insert(data)
      .select('id')
      .single()
    
    if (error) {
      console.error('Supabase INSERT error:', error)
      throw new Error(error.message)
    }
    
    return { lastInsertRowid: result?.id }
  } catch (error: any) {
    console.error('Supabase insert error:', error)
    throw error
  }
}

async function executeSupabaseUpdate(client: any, sql: string, params: any[]): Promise<{}> {
  try {
    const tableName = extractTableName(sql)
    const { updates, whereField, whereValue } = extractUpdateData(sql, params)
    
    let query = client.from(tableName).update(updates)
    
    if (whereField && whereValue !== undefined) {
      query = query.eq(whereField, whereValue)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Supabase UPDATE error:', error)
      throw new Error(error.message)
    }
    
    return {}
  } catch (error: any) {
    console.error('Supabase update error:', error)
    throw error
  }
}

async function executeSupabaseDelete(client: any, sql: string, params: any[]): Promise<{}> {
  try {
    const tableName = extractTableName(sql)
    let query = client.from(tableName).delete()
    
    if (sql.toLowerCase().includes('where')) {
      query = applyWhereClause(query, sql, params)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Supabase DELETE error:', error)
      throw new Error(error.message)
    }
    
    return {}
  } catch (error: any) {
    console.error('Supabase delete error:', error)
    throw error
  }
}

async function executeSupabaseJoin(client: any, sql: string, params: any[]): Promise<any[]> {
  if (sql.includes('games g') && sql.includes('JOIN players')) {
    const tournamentId = params[0]
    
    // Get all players from tournament first
    const { data: players, error: playersError } = await client
      .from('players')
      .select('id')
      .eq('tournamentId', tournamentId)
    
    if (playersError) throw new Error(playersError.message)
    
    const playerIds = players?.map((p: any) => p.id) || []
    
    if (playerIds.length === 0) return []
    
    // Get games for these players
    const { data, error } = await client
      .from('games')
      .select(`
        *,
        whitePlayer:players!whitePlayerId(surname, name),
        blackPlayer:players!blackPlayerId(surname, name)
      `)
      .in('whitePlayerId', playerIds)
      .order('date', { ascending: false })
      .order('id', { ascending: false })
    
    if (error) throw new Error(error.message)
    
    return (data || []).map((game: any) => ({
      ...game,
      whiteSurname: game.whitePlayer?.surname,
      whiteName: game.whitePlayer?.name,
      blackSurname: game.blackPlayer?.surname,
      blackName: game.blackPlayer?.name
    }))
  }
  
  return []
}

function extractTableName(sql: string): string {
  const match = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i)
  return match ? match[1] : ''
}

function applyWhereClause(query: any, sql: string, params: any[]): any {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|LIMIT|$)/i)
  if (!whereMatch || params.length === 0) return query
  
  const condition = whereMatch[1].trim()
  
  if (condition.includes('=') && !condition.includes('IN')) {
    const field = condition.split('=')[0].trim()
    query = query.eq(field, params[0])
  }
  
  if (condition.includes('IN')) {
    const field = condition.split('IN')[0].trim().replace('id', 'id')
    const inMatch = condition.match(/IN\s*\(([^)]+)\)/)
    if (inMatch) {
      const placeholders = inMatch[1].split(',').length
      query = query.in(field, params.slice(1, placeholders + 1))
    }
  }
  
  return query
}

function extractInsertData(sql: string, params: any[]): any {
  const columnsMatch = sql.match(/\(([^)]+)\)\s+VALUES/i)
  if (!columnsMatch) return {}
  
  const columns = columnsMatch[1].split(',').map(c => c.trim())
  const data: any = {}
  
  columns.forEach((col, i) => {
    if (params[i] !== undefined) {
      // Convert datetime('now') to actual date
      if (typeof params[i] === 'string' && params[i].includes('datetime')) {
        data[col] = new Date().toISOString()
      } else {
        data[col] = params[i]
      }
    }
  })
  
  return data
}

function extractUpdateData(sql: string, params: any[]): { updates: any; whereField: string; whereValue: any } {
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i)
  const whereMatch = sql.match(/WHERE\s+(.+?)$/i)
  
  const updates: any = {}
  let whereField = ''
  let whereValue: any = undefined
  
  if (setMatch) {
    const sets = setMatch[1].split(',')
    sets.forEach((set, i) => {
      const field = set.split('=')[0].trim()
      if (params[i] !== undefined) {
        updates[field] = params[i]
      }
    })
  }
  
  if (whereMatch) {
    whereField = whereMatch[1].split('=')[0].trim()
    whereValue = params[params.length - 1]
  }
  
  return { updates, whereField, whereValue }
}
