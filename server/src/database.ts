import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Stelle sicher, dass der data Ordner existiert
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'goodnight.db'));

// Erstelle Tabellen
db.exec(`
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
    content TEXT,
    audio_path TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Füge voice_id Spalte hinzu falls nicht vorhanden
try {
  db.exec(`ALTER TABLE stories ADD COLUMN voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL'`);
} catch (e) {
  // Spalte existiert bereits
}

export interface Story {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  voice_id: string;
  content: string | null;
  audio_path: string | null;
  status: 'pending' | 'generating_text' | 'generating_audio' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export const storyDB = {
  create: (story: Omit<Story, 'created_at' | 'updated_at' | 'content' | 'audio_path' | 'status'>) => {
    const stmt = db.prepare(`
      INSERT INTO stories (id, title, description, duration_minutes, voice_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    stmt.run(story.id, story.title, story.description, story.duration_minutes, story.voice_id);
    return storyDB.getById(story.id);
  },

  getById: (id: string): Story | undefined => {
    const stmt = db.prepare('SELECT * FROM stories WHERE id = ?');
    return stmt.get(id) as Story | undefined;
  },

  getAll: (): Story[] => {
    const stmt = db.prepare('SELECT * FROM stories ORDER BY created_at DESC');
    return stmt.all() as Story[];
  },

  updateContent: (id: string, content: string) => {
    const stmt = db.prepare(`
      UPDATE stories
      SET content = ?, status = 'generating_audio', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(content, id);
  },

  updateAudio: (id: string, audioPath: string) => {
    const stmt = db.prepare(`
      UPDATE stories
      SET audio_path = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(audioPath, id);
  },

  updateStatus: (id: string, status: Story['status']) => {
    const stmt = db.prepare(`
      UPDATE stories
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM stories WHERE id = ?');
    stmt.run(id);
  }
};

export default db;
