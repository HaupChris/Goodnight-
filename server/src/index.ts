import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { storyDB } from './database';
import { generateStory, getAvailableVoices, getNarrationStyles, getStoryCategories, getRandomIdeasForCategory, testAllAPIs, testElevenLabsAPI, testElevenLabsVoices, testOpenAIAPI } from './ai-service';

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

// ============================================
// Health Check & API Test Routes
// ============================================

// Basis Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test alle APIs
app.get('/api/health/apis', async (_req, res) => {
  try {
    const results = await testAllAPIs();
    const allOk = results.every(r => r.status === 'ok');

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test nur ElevenLabs
app.get('/api/health/elevenlabs', async (_req, res) => {
  try {
    const result = await testElevenLabsAPI();
    res.status(result.status === 'ok' ? 200 : 503).json(result);
  } catch (error) {
    res.status(500).json({
      service: 'ElevenLabs',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test ElevenLabs Stimmen-Verfügbarkeit
app.get('/api/health/voices', async (_req, res) => {
  try {
    const result = await testElevenLabsVoices();
    res.status(result.status === 'ok' ? 200 : 503).json(result);
  } catch (error) {
    res.status(500).json({
      service: 'ElevenLabs Voices',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test nur OpenAI
app.get('/api/health/openai', async (_req, res) => {
  try {
    const result = await testOpenAIAPI();
    res.status(result.status === 'ok' ? 200 : 503).json(result);
  } catch (error) {
    res.status(500).json({
      service: 'OpenAI',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// Voice & Sound Routes
// ============================================

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

// Verfügbare Erzählstile abrufen
app.get('/api/styles', (_req, res) => {
  try {
    const styles = getNarrationStyles();
    res.json(styles);
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Stile' });
  }
});

// Story-Kategorien abrufen
app.get('/api/categories', (_req, res) => {
  try {
    const categories = getStoryCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
  }
});

// Zufällige Ideen für eine Kategorie generieren
app.get('/api/categories/:id/ideas', (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const ideas = getRandomIdeasForCategory(req.params.id, count);
    if (ideas.length === 0) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' });
    }
    res.json(ideas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ error: 'Fehler beim Generieren der Ideen' });
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
    const { title, description, duration_minutes, voice_id, style_id } = req.body;

    if (!title || !description || !duration_minutes) {
      return res.status(400).json({ error: 'Titel, Beschreibung und Dauer sind erforderlich' });
    }

    const id = uuidv4();
    const selectedVoiceId = voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
    const selectedStyleId = style_id || 'scientific'; // Default: Wissenschaftlich

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
      selectedStyleId,
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

app.listen(PORT, async () => {
  console.log(`🌙 Goodnight Server läuft auf Port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('🔍 Teste API-Verbindungen...');

  // Führe Startup-Tests durch
  try {
    const results = await testAllAPIs();

    results.forEach(result => {
      const icon = result.status === 'ok' ? '✅' : '❌';
      console.log(`   ${icon} ${result.service}: ${result.message}`);
      if (result.status === 'error' && result.details) {
        console.log(`      Details:`, JSON.stringify(result.details, null, 2));
      }
      if (result.latency_ms) {
        console.log(`      Latenz: ${result.latency_ms}ms`);
      }
    });

    const allOk = results.every(r => r.status === 'ok');
    console.log('');
    if (allOk) {
      console.log('✨ Alle APIs sind bereit!');
    } else {
      console.log('⚠️  Einige APIs haben Probleme. Prüfe die Environment Variables.');
    }
  } catch (error) {
    console.error('❌ Fehler beim Testen der APIs:', error);
  }

  console.log('');
  console.log('📡 Test-Endpoints:');
  console.log(`   GET /api/health            - Basis Health Check`);
  console.log(`   GET /api/health/apis       - Alle APIs testen`);
  console.log(`   GET /api/health/elevenlabs - ElevenLabs API testen`);
  console.log(`   GET /api/health/voices     - Stimmen-Verfügbarkeit testen`);
  console.log(`   GET /api/health/openai     - OpenAI testen`);
});
