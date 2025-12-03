import { useState, useEffect, useCallback } from 'react'
import { Story, View } from './types'
import { Moon, Plus, BookOpen, Sparkles } from 'lucide-react'
import CreateStory from './components/CreateStory'
import StoryLibrary from './components/StoryLibrary'
import StoryPlayer from './components/StoryPlayer'

function App() {
  const [view, setView] = useState<View>('home')
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStories = useCallback(async () => {
    try {
      const response = await fetch('/api/stories')
      const data = await response.json()
      setStories(data)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStories()

    // Poll für Updates wenn Geschichten generiert werden
    const interval = setInterval(() => {
      const hasGenerating = stories.some(
        s => s.status === 'pending' || s.status === 'generating_text' || s.status === 'generating_audio'
      )
      if (hasGenerating) {
        fetchStories()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchStories, stories])

  const handleStoryCreated = () => {
    fetchStories()
    setView('library')
  }

  const handlePlayStory = (story: Story) => {
    setSelectedStory(story)
    setView('player')
  }

  const handleDeleteStory = async (id: string) => {
    try {
      await fetch(`/api/stories/${id}`, { method: 'DELETE' })
      fetchStories()
      if (selectedStory?.id === id) {
        setSelectedStory(null)
        setView('library')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
    }
  }

  return (
    <div className="min-h-screen stars-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass safe-top">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-night-200 hover:text-white transition-colors"
          >
            <Moon className="w-6 h-6 text-night-300 animate-pulse-slow" />
            <span className="font-semibold text-lg">Gute Nacht</span>
          </button>

          <nav className="flex gap-2">
            <button
              onClick={() => setView('library')}
              className={`p-2 rounded-full transition-all ${
                view === 'library' ? 'bg-night-700 text-white' : 'text-night-400 hover:text-white'
              }`}
              aria-label="Bibliothek"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('create')}
              className={`p-2 rounded-full transition-all ${
                view === 'create' ? 'bg-night-700 text-white' : 'text-night-400 hover:text-white'
              }`}
              aria-label="Neue Geschichte"
            >
              <Plus className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pb-8 safe-bottom">
        {view === 'home' && (
          <HomeView
            stories={stories}
            onCreateClick={() => setView('create')}
            onLibraryClick={() => setView('library')}
            onPlayStory={handlePlayStory}
          />
        )}

        {view === 'create' && (
          <CreateStory onStoryCreated={handleStoryCreated} />
        )}

        {view === 'library' && (
          <StoryLibrary
            stories={stories}
            isLoading={isLoading}
            onPlayStory={handlePlayStory}
            onDeleteStory={handleDeleteStory}
            onCreateClick={() => setView('create')}
          />
        )}

        {view === 'player' && selectedStory && (
          <StoryPlayer
            story={selectedStory}
            onBack={() => setView('library')}
          />
        )}
      </main>
    </div>
  )
}

// Home View Component
function HomeView({
  stories,
  onCreateClick,
  onLibraryClick,
  onPlayStory,
}: {
  stories: Story[]
  onCreateClick: () => void
  onLibraryClick: () => void
  onPlayStory: (story: Story) => void
}) {
  const completedStories = stories.filter(s => s.status === 'completed')
  const latestStory = completedStories[0]

  return (
    <div className="py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Moon className="w-20 h-20 text-night-300 animate-float" />
          <Sparkles className="w-6 h-6 text-dream-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-white">Gute Nacht</h1>
        <p className="text-night-300 max-w-xs mx-auto">
          Sanfte Einschlafgeschichten, die dich auf eine Reise durch das Universum mitnehmen
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onCreateClick}
          className="glass rounded-2xl p-6 text-left hover:bg-white/10 transition-all group"
        >
          <Plus className="w-8 h-8 text-night-400 group-hover:text-night-300 mb-3" />
          <h3 className="font-semibold text-white mb-1">Neue Geschichte</h3>
          <p className="text-sm text-night-400">Erstelle deine eigene</p>
        </button>

        <button
          onClick={onLibraryClick}
          className="glass rounded-2xl p-6 text-left hover:bg-white/10 transition-all group"
        >
          <BookOpen className="w-8 h-8 text-night-400 group-hover:text-night-300 mb-3" />
          <h3 className="font-semibold text-white mb-1">Bibliothek</h3>
          <p className="text-sm text-night-400">{completedStories.length} Geschichten</p>
        </button>
      </div>

      {/* Latest Story */}
      {latestStory && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-night-400 uppercase tracking-wider">
            Zuletzt erstellt
          </h2>
          <button
            onClick={() => onPlayStory(latestStory)}
            className="w-full glass rounded-2xl p-5 text-left hover:bg-white/10 transition-all glow-sm"
          >
            <h3 className="font-semibold text-white mb-1">{latestStory.title}</h3>
            <p className="text-sm text-night-400 line-clamp-2">{latestStory.description}</p>
            <div className="mt-3 flex items-center text-xs text-night-500">
              <span>{latestStory.duration_minutes} Min</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default App
