import { useState, useEffect } from 'react'
import { Database, Cloud, Save, AlertCircle } from 'lucide-react'

export function Settings() {
  const [mode, setMode] = useState<'local' | 'turso' | 'supabase'>('local')
  const [tursoUrl, setTursoUrl] = useState('')
  const [tursoToken, setTursoToken] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.db.getConfig()
      setMode(config.mode || 'local')
      setTursoUrl(config.tursoUrl || '')
      setTursoToken(config.tursoAuthToken || '')
      setSupabaseUrl(config.supabaseUrl || '')
      setSupabaseKey(config.supabaseAnonKey || '')
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const config: any = { mode }
      
      if (mode === 'turso') {
        if (!tursoUrl || !tursoToken) {
          setMessage({ type: 'error', text: 'Vul zowel URL als token in voor Turso cloud database' })
          setSaving(false)
          return
        }
        config.tursoUrl = tursoUrl
        config.tursoAuthToken = tursoToken
      } else if (mode === 'supabase') {
        if (!supabaseUrl || !supabaseKey) {
          setMessage({ type: 'error', text: 'Vul zowel URL als anon key in voor Supabase' })
          setSaving(false)
          return
        }
        config.supabaseUrl = supabaseUrl
        config.supabaseAnonKey = supabaseKey
      }

      await window.electronAPI.db.setConfig(config)
      setMessage({ type: 'success', text: 'Instellingen opgeslagen! Herstart de applicatie om de wijzigingen toe te passen.' })
    } catch (error) {
      console.error('Failed to save config:', error)
      setMessage({ type: 'error', text: 'Fout bij opslaan van instellingen' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Instellingen</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Database Configuratie</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="space-y-6">
            {/* Local Database Option */}
            <div
              onClick={() => setMode('local')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                mode === 'local'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={mode === 'local'}
                    onChange={() => setMode('local')}
                    className="w-4 h-4 text-primary-600"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-gray-600" />
                    <label className="text-lg font-medium text-gray-900">
                      Lokale Database
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Database wordt opgeslagen op deze computer. Elke computer heeft zijn eigen data.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    ✓ Werkt offline<br />
                    ✓ Geen configuratie nodig<br />
                    ✗ Niet gedeeld tussen computers
                  </div>
                </div>
              </div>
            </div>

            {/* Turso Cloud Option */}
            <div
              onClick={() => setMode('turso')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                mode === 'turso'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={mode === 'turso'}
                    onChange={() => setMode('turso')}
                    className="w-4 h-4 text-primary-600"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Cloud className="w-5 h-5 mr-2 text-blue-600" />
                    <label className="text-lg font-medium text-gray-900">
                      Turso Cloud Database
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Database wordt gehost in de cloud. Meerdere computers kunnen tegelijk werken met dezelfde data.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    ✓ Gedeeld tussen computers<br />
                    ✓ Automatische sync<br />
                    ✓ Gratis tier beschikbaar<br />
                    ⚠ Vereist internet verbinding
                  </div>
                </div>
              </div>

              {mode === 'turso' && (
                <div className="mt-4 space-y-4 pl-7">
                  <div>
                    <label className="label">Database URL</label>
                    <input
                      type="text"
                      className="input font-mono text-sm"
                      placeholder="libsql://[naam].turso.io"
                      value={tursoUrl}
                      onChange={(e) => setTursoUrl(e.target.value)}
                      required={mode === 'turso'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Te vinden in je Turso dashboard
                    </p>
                  </div>

                  <div>
                    <label className="label">Auth Token</label>
                    <input
                      type="password"
                      className="input font-mono text-sm"
                      placeholder="eyJhbGciOiJFZERTQS..."
                      value={tursoToken}
                      onChange={(e) => setTursoToken(e.target.value)}
                      required={mode === 'turso'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Genereer een token in je Turso dashboard
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-900 mb-1">💡 Turso Cloud Setup:</p>
                    <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Ga naar <a href="https://turso.tech" target="_blank" rel="noopener noreferrer" className="underline">turso.tech</a></li>
                      <li>Maak een gratis account aan</li>
                      <li>Maak een nieuwe database aan</li>
                      <li>Kopieer de URL en genereer een token</li>
                      <li>Plak beide hier en klik op Opslaan</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Supabase Cloud Option */}
            <div
              onClick={() => setMode('supabase')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                mode === 'supabase'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={mode === 'supabase'}
                    onChange={() => setMode('supabase')}
                    className="w-4 h-4 text-primary-600"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Cloud className="w-5 h-5 mr-2 text-green-600" />
                    <label className="text-lg font-medium text-gray-900">
                      Supabase Database
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    PostgreSQL database in de cloud via Supabase. Sneller dan Turso!
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    ✓ Zeer snel (PostgreSQL)<br />
                    ✓ Gedeeld tussen computers<br />
                    ✓ Automatische sync<br />
                    ✓ Gratis tier: 500 MB<br />
                    ⚠ Vereist internet verbinding
                  </div>
                </div>
              </div>

              {mode === 'supabase' && (
                <div className="mt-4 space-y-4 pl-7">
                  <div>
                    <label className="label">Project URL</label>
                    <input
                      type="text"
                      className="input font-mono text-sm"
                      placeholder="https://xxxxx.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      required={mode === 'supabase'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Te vinden in je Supabase project settings
                    </p>
                  </div>

                  <div>
                    <label className="label">Anon Public Key</label>
                    <input
                      type="password"
                      className="input font-mono text-sm"
                      placeholder="eyJhbGciOiJIUzI1NiI..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      required={mode === 'supabase'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Te vinden in Settings → API → anon public key
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-900 mb-1">💡 Supabase Setup:</p>
                    <ol className="text-green-800 space-y-1 list-decimal list-inside">
                      <li>Ga naar <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                      <li>Maak een gratis account aan</li>
                      <li>Maak een nieuw project aan</li>
                      <li>Kopieer de Project URL en anon key</li>
                      <li>Plak beide hier en klik op Opslaan</li>
                      <li><strong>Belangrijk:</strong> Maak de tabellen aan via SQL Editor (zie SUPABASE_SETUP.md)</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-success"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {saving ? 'Bezig met opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Let op:</strong> Na het wijzigen van de database instellingen moet je de applicatie herstarten.
          Bij overschakelen naar een andere database blijft je oude data behouden in de oorspronkelijke database.
        </p>
      </div>
    </div>
  )
}
