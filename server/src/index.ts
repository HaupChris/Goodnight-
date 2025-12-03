import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { storyDB } from './database';
import { generateStory, getAvailableVoices } from './ai-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static audio files
app.use('/audio', express.static(path.join(__dirname, '..', 'data', 'audio')));

// Serve static ambient sounds
app.use('/sounds', express.static(path.join(__dirname, '..', 'assets', 'sounds')));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

// API Routes

// Verfügbare Stimmen abrufen
app.get('/api/voices', (_req, res) => {
  try {
    const voices = getAvailableVoices();
    res.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Stimmen' });
  }
});

// Verfügbare Hintergrundgeräusche
app.get('/api/ambient-sounds', (_req, res) => {
  const sounds = [
    {
      id: 'rain',
      name: 'Sanfter Regen',
      description: 'Beruhigendes Regengeräusch',
      file: 'rain.mp3'
    },
    {
      id: 'ocean',
      name: 'Ozeanwellen',
      description: 'Sanfte Wellen am Strand',
      file: 'ocean.mp3'
    },
    {
      id: 'forest',
      name: 'Nachtwald',
      description: 'Grillen und leichter Wind',
      file: 'forest.mp3'
    },
    {
      id: 'fire',
      name: 'Kaminfeuer',
      description: 'Knisterndes Feuer',
      file: 'fire.mp3'
    },
    {
      id: 'space',
      name: 'Weltraum',
      description: 'Sanftes kosmisches Rauschen',
      file: 'space.mp3'
    }
  ];
  res.json(sounds);
});

// Alle Geschichten abrufen
app.get('/api/stories', (_req, res) => {
  try {
    const stories = storyDB.getAll();
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Geschichten' });
  }
});

// Eine Geschichte abrufen
app.get('/api/stories/:id', (req, res) => {
  try {
    const story = storyDB.getById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Geschichte nicht gefunden' });
    }
    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Geschichte' });
  }
});

// Neue Geschichte erstellen und generieren
app.post('/api/stories', async (req, res) => {
  try {
    const { title, description, duration_minutes, voice_id } = req.body;

    if (!title || !description || !duration_minutes) {
      return res.status(400).json({ error: 'Titel, Beschreibung und Dauer sind erforderlich' });
    }

    const id = uuidv4();
    const selectedVoiceId = voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah

    // Erstelle den Datenbankeintrag
    const story = storyDB.create({
      id,
      title,
      description,
      duration_minutes: parseInt(duration_minutes, 10),
      voice_id: selectedVoiceId
    });

    // Sende sofort die Antwort
    res.status(201).json(story);

    // Generiere die Geschichte im Hintergrund
    generateStory(
      description,
      parseInt(duration_minutes, 10),
      id,
      selectedVoiceId,
      (status, content) => {
        if (status === 'generating_text') {
          storyDB.updateStatus(id, 'generating_text');
        } else if (status === 'generating_audio' && content) {
          storyDB.updateContent(id, content);
        }
      }
    ).then(({ audioPath }) => {
      storyDB.updateAudio(id, audioPath);
    }).catch((error) => {
      console.error('Error generating story:', error);
      storyDB.updateStatus(id, 'error');
    });

  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Geschichte' });
  }
});

// Geschichte löschen
app.delete('/api/stories/:id', (req, res) => {
  try {
    const story = storyDB.getById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Geschichte nicht gefunden' });
    }

    // Lösche Audio-Datei wenn vorhanden
    if (story.audio_path) {
      const audioPath = path.join(__dirname, '..', 'data', 'audio', story.audio_path);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    storyDB.delete(req.params.id);
    res.json({ message: 'Geschichte gelöscht' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Geschichte' });
  }
});

// Fallback für SPA-Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌙 Goodnight Server läuft auf Port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});
