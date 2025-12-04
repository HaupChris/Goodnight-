import { useState, useRef, useEffect } from 'react'
import { Story, AmbientSound } from '../types'
import {
  ArrowLeft, Play, Pause, RotateCcw, Moon, Volume2, VolumeX,
  ChevronDown, ChevronUp, CloudRain, Waves, TreePine, Flame, Sparkles, X, Gauge
} from 'lucide-react'

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

interface StoryPlayerProps {
  story: Story
  onBack: () => void
}

// Icons für Ambient Sounds
const AMBIENT_ICONS: Record<string, React.ElementType> = {
  rain: CloudRain,
  ocean: Waves,
  forest: TreePine,
  fire: Flame,
  space: Sparkles,
}

export default function StoryPlayer({ story, onBack }: StoryPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const ambientRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showText, setShowText] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedPicker, setShowSpeedPicker] = useState(false)

  // Ambient Sound State
  const [ambientSounds, setAmbientSounds] = useState<AmbientSound[]>([])
  const [selectedAmbient, setSelectedAmbient] = useState<string | null>(null)
  const [ambientVolume, setAmbientVolume] = useState(0.3)
  const [showAmbientPicker, setShowAmbientPicker] = useState(false)

  // Lade Ambient Sounds
  useEffect(() => {
    fetch('/api/ambient-sounds')
      .then(res => res.json())
      .then(data => setAmbientSounds(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      // Stoppe auch Ambient Sound wenn Geschichte endet
      if (ambientRef.current) {
        ambientRef.current.pause()
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Sync Ambient Sound mit Hauptaudio
  useEffect(() => {
    const ambient = ambientRef.current
    if (!ambient) return

    if (isPlaying && selectedAmbient) {
      ambient.play().catch(() => {})
    } else {
      ambient.pause()
    }
  }, [isPlaying, selectedAmbient])

  // Update Ambient Volume
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume
    }
  }, [ambientVolume])

  // Update Playback Speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

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
    const ambient = ambientRef.current
    if (!audio) return

    const newMuted = !isMuted
    audio.muted = newMuted
    if (ambient) ambient.muted = newMuted
    setIsMuted(newMuted)
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

  const selectAmbientSound = (soundId: string | null) => {
    setSelectedAmbient(soundId)
    setShowAmbientPicker(false)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const selectedSound = ambientSounds.find(s => s.id === selectedAmbient)

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

      {/* Audio Elements */}
      <audio ref={audioRef} src={`/audio/${story.audio_path}`} preload="metadata" />
      {selectedAmbient && (
        <audio
          ref={ambientRef}
          src={`/sounds/${selectedSound?.file}`}
          loop
          preload="metadata"
        />
      )}

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

      {/* Playback Speed */}
      <div className="glass rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowSpeedPicker(!showSpeedPicker)}
          className="w-full p-4 flex items-center justify-between text-night-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5" />
            <span className="text-sm font-medium">Geschwindigkeit: {playbackSpeed}x</span>
          </div>
          {showSpeedPicker ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {showSpeedPicker && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed)
                    setShowSpeedPicker(false)
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    playbackSpeed === speed
                      ? 'bg-night-600 text-white'
                      : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ambient Sounds Section */}
      <div className="glass rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAmbientPicker(!showAmbientPicker)}
          className="w-full p-4 flex items-center justify-between text-night-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            {selectedAmbient && selectedSound ? (
              <>
                {(() => {
                  const Icon = AMBIENT_ICONS[selectedAmbient] || Waves
                  return <Icon className="w-5 h-5 text-dream-400" />
                })()}
                <span className="text-sm font-medium">{selectedSound.name}</span>
              </>
            ) : (
              <>
                <Waves className="w-5 h-5" />
                <span className="text-sm font-medium">Hintergrundgeräusch</span>
              </>
            )}
          </div>
          {showAmbientPicker ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {showAmbientPicker && (
          <div className="px-4 pb-4 space-y-3">
            {/* Keine Auswahl */}
            <button
              onClick={() => selectAmbientSound(null)}
              className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                selectedAmbient === null
                  ? 'bg-night-600 text-white'
                  : 'bg-night-800/50 text-night-400 hover:bg-night-700'
              }`}
            >
              <X className="w-5 h-5" />
              <span className="text-sm">Kein Hintergrundgeräusch</span>
            </button>

            {/* Sound Optionen */}
            {ambientSounds.map((sound) => {
              const Icon = AMBIENT_ICONS[sound.id] || Waves
              return (
                <button
                  key={sound.id}
                  onClick={() => selectAmbientSound(sound.id)}
                  className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                    selectedAmbient === sound.id
                      ? 'bg-night-600 text-white'
                      : 'bg-night-800/50 text-night-400 hover:bg-night-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="block text-sm font-medium">{sound.name}</span>
                    <span className="block text-xs opacity-70">{sound.description}</span>
                  </div>
                </button>
              )
            })}

            {/* Lautstärke Slider */}
            {selectedAmbient && (
              <div className="pt-2 space-y-2">
                <label className="text-xs text-night-500">Lautstärke Hintergrund</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-night-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
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
