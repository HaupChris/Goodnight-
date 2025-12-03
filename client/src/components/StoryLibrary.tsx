import { Story } from '../types'
import { BookOpen, Play, Trash2, Loader2, Clock, Plus, AlertCircle } from 'lucide-react'

interface StoryLibraryProps {
  stories: Story[]
  isLoading: boolean
  onPlayStory: (story: Story) => void
  onDeleteStory: (id: string) => void
  onCreateClick: () => void
}

function getStatusInfo(status: Story['status']) {
  switch (status) {
    case 'pending':
      return { text: 'Wartet...', color: 'text-night-400' }
    case 'generating_text':
      return { text: 'Text wird generiert...', color: 'text-dream-400' }
    case 'generating_audio':
      return { text: 'Audio wird erstellt...', color: 'text-dream-400' }
    case 'completed':
      return { text: 'Fertig', color: 'text-green-400' }
    case 'error':
      return { text: 'Fehler', color: 'text-red-400' }
    default:
      return { text: status, color: 'text-night-400' }
  }
}

export default function StoryLibrary({
  stories,
  isLoading,
  onPlayStory,
  onDeleteStory,
  onCreateClick,
}: StoryLibraryProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-night-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Lade Geschichten...</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <BookOpen className="w-16 h-16 text-night-600 mx-auto" />
        <h2 className="text-xl font-semibold text-white">Keine Geschichten</h2>
        <p className="text-night-400 max-w-xs mx-auto">
          Deine Bibliothek ist noch leer. Erstelle deine erste Einschlafgeschichte!
        </p>
        <button
          onClick={onCreateClick}
          className="mt-4 px-6 py-3 rounded-xl bg-night-700 text-white font-medium hover:bg-night-600 transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Erste Geschichte erstellen
        </button>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-night-400" />
          Bibliothek
        </h1>
        <span className="text-sm text-night-500">{stories.length} Geschichten</span>
      </div>

      <div className="space-y-3">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onPlay={() => onPlayStory(story)}
            onDelete={() => onDeleteStory(story.id)}
          />
        ))}
      </div>
    </div>
  )
}

function StoryCard({
  story,
  onPlay,
  onDelete,
}: {
  story: Story
  onPlay: () => void
  onDelete: () => void
}) {
  const statusInfo = getStatusInfo(story.status)
  const isReady = story.status === 'completed'
  const isGenerating = story.status === 'pending' || story.status === 'generating_text' || story.status === 'generating_audio'
  const isError = story.status === 'error'

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{story.title}</h3>
          <p className="text-sm text-night-400 line-clamp-2 mt-1">
            {story.description}
          </p>
        </div>

        {isReady && (
          <button
            onClick={onPlay}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-night-600 hover:bg-night-500 text-white flex items-center justify-center transition-all glow-sm"
            aria-label="Abspielen"
          >
            <Play className="w-5 h-5 ml-0.5" />
          </button>
        )}

        {isGenerating && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-night-800 text-dream-400 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-night-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {story.duration_minutes} Min
          </span>
          <span className={statusInfo.color}>{statusInfo.text}</span>
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-night-600 hover:text-red-400 transition-colors"
          aria-label="Löschen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
