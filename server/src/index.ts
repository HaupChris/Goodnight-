import express from 'express';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { storyDB, Story } from './database';
import { generateStory } from './ai-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static audio files
app.use('/audio', express.static(path.join(__dirname, '..', 'data', 'audio')));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

// API Routes

// Alle Geschichten abrufen
app.get('/api/stories', (req, res) => {
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
    const { title, description, duration_minutes } = req.body;

    if (!title || !description || !duration_minutes) {
      return res.status(400).json({ error: 'Titel, Beschreibung und Dauer sind erforderlich' });
    }

    const id = uuidv4();

    // Erstelle den Datenbankeintrag
    const story = storyDB.create({
      id,
      title,
      description,
      duration_minutes: parseInt(duration_minutes, 10)
    });

    // Sende sofort die Antwort
    res.status(201).json(story);

    // Generiere die Geschichte im Hintergrund
    generateStory(
      description,
      parseInt(duration_minutes, 10),
      id,
      (status, content) => {
        if (status === 'generating_text') {
          storyDB.updateStatus(id, 'generating_text');
        } else if (status === 'generating_audio' && content) {
          storyDB.updateContent(id, content);
        } else if (status === 'completed') {
          // Audio path wird in generateStory gesetzt
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
      const fs = require('fs');
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
