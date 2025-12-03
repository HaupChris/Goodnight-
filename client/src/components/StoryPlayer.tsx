import { useState, useRef, useEffect } from 'react'
import { Story } from '../types'
import { ArrowLeft, Play, Pause, RotateCcw, Moon, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react'

interface StoryPlayerProps {
  story: Story
  onBack: () => void
}

export default function StoryPlayer({ story, onBack }: StoryPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setCurrentTime(0)
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-night-400 hover:text-white transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{story.title}</h1>
          <p className="text-sm text-night-400 truncate">{story.description}</p>
        </div>
      </div>

      {/* Visual Element */}
      <div className="relative flex items-center justify-center py-12">
        <div className={`relative ${isPlaying ? 'animate-pulse-slow' : ''}`}>
          <div className="absolute inset-0 bg-night-500/20 rounded-full blur-3xl scale-150" />
          <Moon className="w-32 h-32 text-night-300 relative z-10" />
        </div>
      </div>

      {/* Audio Element (hidden) */}
      <audio ref={audioRef} src={`/audio/${story.audio_path}`} preload="metadata" />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-2 bg-night-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-night-500 to-night-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-night-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={restart}
          className="p-3 text-night-400 hover:text-white transition-colors"
          aria-label="Von vorne"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-night-600 hover:bg-night-500 text-white flex items-center justify-center transition-all glow"
          aria-label={isPlaying ? 'Pause' : 'Abspielen'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-1" />
          )}
        </button>

        <button
          onClick={toggleMute}
          className="p-3 text-night-400 hover:text-white transition-colors"
          aria-label={isMuted ? 'Ton an' : 'Ton aus'}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Text Toggle */}
      {story.content && (
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowText(!showText)}
            className="w-full p-4 flex items-center justify-between text-night-300 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Text anzeigen</span>
            {showText ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showText && (
            <div className="px-4 pb-4">
              <div className="max-h-64 overflow-y-auto text-sm text-night-300 leading-relaxed whitespace-pre-wrap">
                {story.content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sleep Timer Info */}
      <p className="text-center text-xs text-night-600">
        Entspann dich und lass dich sanft in den Schlaf tragen
      </p>
    </div>
  )
}
