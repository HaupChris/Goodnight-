import { useState, useEffect } from 'react'
import { Sparkles, Clock, Loader2, Mic, User, Palette, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Voice, NarrationStyle, StoryCategory, StoryIdea } from '../types'

interface CreateStoryProps {
  onStoryCreated: () => void
}

const DURATION_OPTIONS = [
  { value: 5, label: '5 Min', description: 'Kurze Geschichte' },
  { value: 10, label: '10 Min', description: 'Mittel' },
  { value: 15, label: '15 Min', description: 'Lang' },
  { value: 20, label: '20 Min', description: 'Sehr lang' },
]

export default function CreateStory({ onStoryCreated }: CreateStoryProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(10)
  const [voiceId, setVoiceId] = useState('EXAVITQu4vr4xnSDxMaL')
  const [styleId, setStyleId] = useState('scientific')
  const [voices, setVoices] = useState<Voice[]>([])
  const [styles, setStyles] = useState<NarrationStyle[]>([])
  const [categories, setCategories] = useState<StoryCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [suggestedIdeas, setSuggestedIdeas] = useState<StoryIdea[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    // Lade alle benötigten Daten parallel
    Promise.all([
      fetch('/api/voices').then(res => res.json()),
      fetch('/api/styles').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
    ])
      .then(([voicesData, stylesData, categoriesData]) => {
        setVoices(voicesData)
        setStyles(stylesData)
        setCategories(categoriesData)
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Bitte fülle alle Felder aus')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          duration_minutes: duration,
          voice_id: voiceId,
          style_id: styleId,
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Geschichte')
      }

      onStoryCreated()
    } catch (err) {
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    // Hole zufällige Ideen für diese Kategorie
    fetch(`/api/categories/${categoryId}/ideas?count=3`)
      .then(res => res.json())
      .then(ideas => setSuggestedIdeas(ideas))
      .catch(console.error)
  }

  const refreshIdeas = () => {
    if (selectedCategory) {
      fetch(`/api/categories/${selectedCategory}/ideas?count=3`)
        .then(res => res.json())
        .then(ideas => setSuggestedIdeas(ideas))
        .catch(console.error)
    }
  }

  const handleIdeaSelect = (idea: StoryIdea) => {
    setTitle(idea.title)
    setDescription(idea.description)
  }

  return (
    <div className="py-6 space-y-6">
      <div className="text-center space-y-2">
        <Sparkles className="w-10 h-10 text-dream-300 mx-auto" />
        <h1 className="text-2xl font-bold text-white">Neue Geschichte</h1>
        <p className="text-night-400 text-sm">
          Lass dich inspirieren oder wähle dein eigenes Thema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ideen-Generator */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-night-300">
            <Lightbulb className="w-4 h-4" />
            Lass dich inspirieren
          </label>

          {/* Kategorie-Auswahl */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-dream-500/30 text-dream-300 ring-1 ring-dream-500'
                    : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                }`}
                disabled={isSubmitting}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Vorgeschlagene Ideen */}
          {selectedCategory && suggestedIdeas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-night-500">Vorschläge:</span>
                <button
                  type="button"
                  onClick={refreshIdeas}
                  className="text-xs text-night-500 hover:text-night-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Neue Ideen
                </button>
              </div>
              <div className="grid gap-2">
                {suggestedIdeas.map((idea, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleIdeaSelect(idea)}
                    className="p-3 rounded-xl bg-night-800/30 border border-night-700/50 text-left hover:bg-night-700/50 transition-all"
                    disabled={isSubmitting}
                  >
                    <span className="block font-medium text-white text-sm">{idea.title}</span>
                    <span className="block text-xs text-night-400 mt-1">{idea.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trennlinie */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-night-700"></div>
          <span className="text-xs text-night-500">oder eigenes Thema</span>
          <div className="flex-1 h-px bg-night-700"></div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-night-300">
            Titel
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Die Geheimnisse der Schwarzen Löcher"
            className="w-full px-4 py-3 rounded-xl bg-night-900/50 border border-night-700 text-white placeholder-night-500 focus:outline-none focus:ring-2 focus:ring-night-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-night-300">
            Thema / Beschreibung
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe, worüber du mehr erfahren möchtest..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-night-900/50 border border-night-700 text-white placeholder-night-500 focus:outline-none focus:ring-2 focus:ring-night-500 focus:border-transparent transition-all resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Erzählstil */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-night-300">
            <Palette className="w-4 h-4" />
            Erzählstil
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyleId(style.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  styleId === style.id
                    ? 'bg-dream-500/20 text-dream-300 ring-2 ring-dream-500'
                    : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                }`}
                disabled={isSubmitting}
              >
                <span className="block text-xl mb-1">{style.icon}</span>
                <span className="block font-semibold text-sm">{style.name}</span>
                <span className="block text-xs opacity-70 mt-1">{style.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-night-300">
            <Clock className="w-4 h-4" />
            Dauer
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={`p-3 rounded-xl text-center transition-all ${
                  duration === option.value
                    ? 'bg-night-600 text-white ring-2 ring-night-400'
                    : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                }`}
                disabled={isSubmitting}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="block text-xs opacity-70">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 text-sm text-night-400 hover:text-night-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? 'Weniger Optionen' : 'Mehr Optionen'}
        </button>

        {/* Voice Selection (Advanced) */}
        {showAdvanced && (
          <div className="space-y-3 animate-fadeIn">
            <label className="flex items-center gap-2 text-sm font-medium text-night-300">
              <Mic className="w-4 h-4" />
              Erzählstimme
            </label>
            <div className="grid grid-cols-1 gap-2">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setVoiceId(voice.id)}
                  className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    voiceId === voice.id
                      ? 'bg-night-600 text-white ring-2 ring-night-400'
                      : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    voice.gender === 'female' ? 'bg-dream-500/20' : 'bg-night-500/20'
                  }`}>
                    <User className={`w-5 h-5 ${
                      voice.gender === 'female' ? 'text-dream-400' : 'text-night-300'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">{voice.name}</span>
                    <span className="block text-xs opacity-70 truncate">{voice.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-night-600 to-night-500 text-white font-semibold hover:from-night-500 hover:to-night-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Geschichte wird erstellt...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Geschichte generieren
            </>
          )}
        </button>
      </form>

      {/* Info */}
      <p className="text-center text-xs text-night-500">
        Die KI erstellt eine Geschichte mit hochwertiger Sprachausgabe.
        Das kann 1-2 Minuten dauern.
      </p>
    </div>
  )
}
