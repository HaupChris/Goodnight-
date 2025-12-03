import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Stil-Prompt basierend auf "Einschlafen mit Weltall"
const STORY_STYLE_PROMPT = `Du bist ein sanfter Geschichtenerzähler für Einschlafgeschichten im Stil des Podcasts "Einschlafen mit Weltall".

Dein Stil:
- Ruhig, beruhigend und entspannend
- Faszinierende Fakten über das Weltall, Natur oder Wissenschaft
- Langsame, meditative Erzählweise
- Keine aufregenden oder spannenden Wendungen
- Sanfte Übergänge zwischen Themen
- Beruhigende Beschreibungen von Sternen, Planeten, Galaxien oder Naturphänomenen
- Philosophische, aber leicht verständliche Betrachtungen
- Der Zuhörer soll sanft in den Schlaf gleiten können

Die Geschichte soll wie eine sanfte Reise durchs Universum oder durch die Wunder der Natur sein, die den Geist beruhigt und Raum für friedliche Gedanken schafft.`;

export async function generateStoryText(
  description: string,
  durationMinutes: number
): Promise<string> {
  // Ungefähr 150 Wörter pro Minute beim langsamen Vorlesen
  const targetWordCount = durationMinutes * 120;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: STORY_STYLE_PROMPT
      },
      {
        role: 'user',
        content: `Schreibe eine Einschlafgeschichte basierend auf diesem Thema: "${description}"

Die Geschichte soll etwa ${targetWordCount} Wörter lang sein (für ca. ${durationMinutes} Minuten Vorlesezeit bei ruhigem Tempo).

Beginne direkt mit der Geschichte, ohne Einleitung oder Meta-Kommentare. Die Geschichte soll sanft ausklingen, sodass der Zuhörer friedlich einschlafen kann.`
      }
    ],
    max_tokens: Math.min(targetWordCount * 2, 4096),
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

export async function generateAudio(
  text: string,
  storyId: string
): Promise<string> {
  // Stelle sicher, dass der Audio-Ordner existiert
  const audioDir = path.join(__dirname, '..', 'data', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const audioPath = path.join(audioDir, `${storyId}.mp3`);

  // OpenAI TTS API - nutze "nova" für eine sanfte, beruhigende Stimme
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova', // Sanfte, beruhigende Stimme
    input: text,
    speed: 0.9, // Etwas langsamer für Einschlafgeschichten
  });

  // Speichere die Audio-Datei
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(audioPath, buffer);

  return `${storyId}.mp3`;
}

export async function generateStory(
  description: string,
  durationMinutes: number,
  storyId: string,
  onStatusUpdate: (status: string, content?: string) => void
): Promise<{ content: string; audioPath: string }> {
  // Generiere Text
  onStatusUpdate('generating_text');
  const content = await generateStoryText(description, durationMinutes);
  onStatusUpdate('generating_audio', content);

  // Generiere Audio
  const audioPath = await generateAudio(content, storyId);
  onStatusUpdate('completed');

  return { content, audioPath };
}
