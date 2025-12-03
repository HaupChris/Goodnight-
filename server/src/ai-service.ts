import OpenAI from 'openai';
import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Debug: Prüfe ob API Keys geladen sind
console.log('ELEVENLABS_API_KEY loaded:', process.env.ELEVENLABS_API_KEY ? `${process.env.ELEVENLABS_API_KEY.substring(0, 8)}...` : 'NOT SET');

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Verfügbare ElevenLabs Stimmen für Einschlafgeschichten
export const AVAILABLE_VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - sanft, warm
    name: 'Sarah',
    description: 'Sanft und warm, perfekt für beruhigende Geschichten',
    gender: 'female',
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/voices/EXAVITQu4vr4xnSDxMaL/manifest.json'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - ruhig, tief
    name: 'Daniel',
    description: 'Ruhige, tiefe Stimme wie ein Hörbuch-Erzähler',
    gender: 'male',
    preview_url: null
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa', // Charlotte - sanft, klar
    name: 'Charlotte',
    description: 'Sanft und klar, ideal für wissenschaftliche Themen',
    gender: 'female',
    preview_url: null
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - ruhig, melodisch
    name: 'Lily',
    description: 'Ruhig und melodisch, wie ein Gutenacht-Lied',
    gender: 'female',
    preview_url: null
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - warm, beruhigend
    name: 'Liam',
    description: 'Warm und beruhigend, entspannter Erzählstil',
    gender: 'male',
    preview_url: null
  }
];

// Verbesserter Prompt für wissenschaftlich fundierte, aber beruhigende Geschichten
const STORY_STYLE_PROMPT = `Du bist ein erfahrener Wissenschafts-Geschichtenerzähler, der komplexe Themen auf faszinierende und zugleich beruhigende Weise vermittelt – im Stil des Podcasts "Einschlafen mit Weltall".

## Deine Kernprinzipien:

### 1. Wissenschaftliche Tiefe mit Zugänglichkeit
- Erkläre echte wissenschaftliche Konzepte, Phänomene und Entdeckungen
- Verwende konkrete Zahlen, Fakten und Forschungsergebnisse
- Nenne Wissenschaftler, Missionen oder Studien, wenn passend
- Erkläre das "Warum" hinter den Phänomenen, nicht nur das "Was"
- Vermeide Oberflächlichkeit – gehe in die Details, aber erkläre sie verständlich

### 2. Erzählerischer Fluss
- Baue die Geschichte wie eine gedankliche Reise auf
- Führe von einem Konzept sanft zum nächsten
- Nutze Übergänge wie "Und wenn wir noch weiter hinausschauen..." oder "Was noch faszinierender ist..."
- Jeder Absatz sollte neues Wissen vermitteln

### 3. Beruhigender Stil trotz faszinierender Inhalte
- Langsame, meditative Satzrhythmen
- Verwende Wörter wie: sanft, still, unendlich, friedlich, geheimnisvoll
- Keine dramatischen Wendungen oder beunruhigenden Szenarien
- Die Faszination kommt aus dem Staunen, nicht aus Spannung

### 4. Konkrete Beispiele statt Abstraktionen
- Statt "Das Universum ist groß": "Das Licht unserer Nachbargalaxie Andromeda, das heute Nacht deine Augen erreicht, begann seine Reise vor 2,5 Millionen Jahren"
- Statt "Sterne sind heiß": "Im Kern unserer Sonne verschmelzen jede Sekunde 600 Millionen Tonnen Wasserstoff zu Helium"

### 5. Thematische Vielfalt
Je nach gewähltem Thema kannst du über folgendes sprechen:
- Astrophysik: Schwarze Löcher, Neutronensterne, Dunkle Materie, Gravitationswellen
- Kosmologie: Urknall, kosmische Hintergrundstrahlung, Expansion des Universums
- Planetenwissenschaft: Monde, Exoplaneten, Atmosphären, Geologie anderer Welten
- Biologie: Evolution, Zellprozesse, Ökosysteme, Tiefseeleben
- Physik: Quantenmechanik, Relativität, Thermodynamik
- Geowissenschaften: Plattentektonik, Ozeane, Atmosphäre, Klimasysteme
- Geschichte der Wissenschaft: Entdeckungen, Teleskope, Raumfahrtmissionen

## Stilistische Regeln:
- Schreibe in der zweiten Person ("du") für Intimität
- Beginne direkt mit dem Thema, keine Meta-Einleitung
- Ende mit einem beruhigenden Ausklang, der zum Einschlafen einlädt
- Vermeide Ausrufezeichen
- Nutze lange, fließende Sätze mit Nebensätzen
- Integriere sanfte Aufforderungen zur Entspannung zwischen den Wissensblöcken`;

export async function generateStoryText(
  description: string,
  durationMinutes: number
): Promise<string> {
  // Ungefähr 130 Wörter pro Minute beim langsamen Vorlesen
  const targetWordCount = durationMinutes * 130;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: STORY_STYLE_PROMPT
      },
      {
        role: 'user',
        content: `Schreibe eine wissenschaftlich fundierte Einschlafgeschichte zum Thema: "${description}"

Anforderungen:
- Länge: etwa ${targetWordCount} Wörter (für ca. ${durationMinutes} Minuten)
- Vermittle echtes, interessantes Wissen – keine oberflächlichen Platitüden
- Erkläre mindestens 3-4 konkrete wissenschaftliche Konzepte oder Fakten
- Halte dabei den beruhigenden, meditativen Erzählfluss
- Ende sanft, sodass der Zuhörer friedlich einschlafen kann

Beginne direkt mit der Geschichte.`
      }
    ],
    max_tokens: 4096,
    temperature: 0.75,
  });

  return response.choices[0]?.message?.content || '';
}

export async function generateAudio(
  text: string,
  storyId: string,
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL' // Default: Sarah
): Promise<string> {
  // Stelle sicher, dass der Audio-Ordner existiert
  const audioDir = path.join(__dirname, '..', 'data', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const audioPath = path.join(audioDir, `${storyId}.mp3`);

  console.log(`Generating audio with ElevenLabs (voice: ${voiceId})...`);

  try {
    // ElevenLabs API - kein Chunking nötig, unterstützt lange Texte
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: 'eleven_multilingual_v2', // Beste Qualität für Deutsch
      voice_settings: {
        stability: 0.75,        // Höhere Stabilität für konsistente Erzählung
        similarity_boost: 0.75, // Natürliche Stimme
        style: 0.35,            // Leichter Stil für Lebendigkeit
        use_speaker_boost: true
      }
    });

    // Stream zu Buffer konvertieren
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`Audio saved: ${audioPath} (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return `${storyId}.mp3`;
  } catch (error: unknown) {
    console.error('ElevenLabs error:');
    console.error('  Type:', error?.constructor?.name);

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      console.error('  Status:', err.statusCode || err.status);
      console.error('  Message:', err.message);
      console.error('  Body:', JSON.stringify(err.body, null, 2));

      // Falls es einen response body gibt
      if (err.rawResponse) {
        console.error('  Raw Response:', err.rawResponse);
      }
    }

    console.error('  Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
    throw new Error('Audio-Generierung fehlgeschlagen');
  }
}

export async function generateStory(
  description: string,
  durationMinutes: number,
  storyId: string,
  voiceId: string,
  onStatusUpdate: (status: string, content?: string) => void
): Promise<{ content: string; audioPath: string }> {
  // Generiere Text
  onStatusUpdate('generating_text');
  const content = await generateStoryText(description, durationMinutes);
  onStatusUpdate('generating_audio', content);

  // Generiere Audio mit ElevenLabs
  const audioPath = await generateAudio(content, storyId, voiceId);
  onStatusUpdate('completed');

  return { content, audioPath };
}

// Hilfsfunktion um verfügbare Stimmen zu bekommen
export function getAvailableVoices() {
  return AVAILABLE_VOICES;
}
