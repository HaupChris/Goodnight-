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

// Erzählstile
export const NARRATION_STYLES = [
  {
    id: 'scientific',
    name: 'Wissenschaftlich',
    description: 'Faktenreich und lehrreich, wie ein Podcast',
    icon: '🔬',
    promptAddition: `Fokussiere dich auf wissenschaftliche Fakten, Zahlen und Forschungsergebnisse.
Erkläre die Mechanismen und das "Warum" hinter Phänomenen.
Nenne konkrete Studien, Missionen oder Wissenschaftler wenn passend.`
  },
  {
    id: 'dreamy',
    name: 'Verträumt',
    description: 'Poetisch und bildreich, wie ein Traum',
    icon: '🌙',
    promptAddition: `Nutze bildhafte, poetische Sprache voller Metaphern.
Beschreibe Sinneseindrücke: Farben, Klänge, Gefühle.
Lass die Grenzen zwischen Realität und Traum verschwimmen.
Die Sprache sollte fließend und melodisch sein, wie sanfte Wellen.`
  },
  {
    id: 'fairytale',
    name: 'Märchenhaft',
    description: 'Magisch und wunderbar, wie ein Märchen',
    icon: '✨',
    promptAddition: `Erzähle wie in einem klassischen Märchen mit sanfter Magie.
Nutze Formulierungen wie "Es war einmal..." oder "In einer Welt, wo...".
Verleihe wissenschaftlichen Konzepten einen Hauch von Zauber.
Lass Sterne, Planeten und Naturphänomene wie lebendige Wesen erscheinen.`
  },
  {
    id: 'meditative',
    name: 'Meditativ',
    description: 'Ruhig und achtsam, wie eine Meditation',
    icon: '🧘',
    promptAddition: `Sprich in einem langsamen, achtsamen Rhythmus.
Füge Atemübungen und Entspannungsanleitungen zwischen die Inhalte ein.
Nutze Formulierungen wie "Atme tief ein..." oder "Spüre, wie...".
Der Fokus liegt auf Ruhe und dem gegenwärtigen Moment.`
  },
  {
    id: 'adventure',
    name: 'Abenteuerlich',
    description: 'Sanfte Entdeckungsreise, wie eine Expedition',
    icon: '🚀',
    promptAddition: `Gestalte die Geschichte als ruhige Entdeckungsreise.
Der Zuhörer ist ein Beobachter, der durch faszinierende Welten schwebt.
Beschreibe die Reise durch Raum und Zeit, aber ohne Dramatik oder Gefahr.
Jede Entdeckung ist ein friedliches Staunen.`
  }
];

// Story-Kategorien mit Ideen-Generator
export const STORY_CATEGORIES = [
  {
    id: 'universe',
    name: 'Universum',
    icon: '🌌',
    ideas: [
      { title: 'Die Geburt eines Sterns', description: 'Wie in kosmischen Gaswolken neue Sonnen entstehen' },
      { title: 'Schwarze Löcher', description: 'Die geheimnisvollen Riesen, die selbst Licht verschlucken' },
      { title: 'Die Milchstraße', description: 'Eine Reise durch unsere Heimatgalaxie mit ihren 200 Milliarden Sternen' },
      { title: 'Exoplaneten', description: 'Ferne Welten um andere Sterne und die Suche nach Leben' },
      { title: 'Neutronensterne', description: 'Die dichtesten Objekte im Universum, ein Teelöffel wiegt Milliarden Tonnen' },
      { title: 'Das Ende der Sterne', description: 'Wie Sterne sterben - von weißen Zwergen bis Supernovae' },
      { title: 'Dunkle Materie', description: 'Das unsichtbare Gerüst, das Galaxien zusammenhält' },
      { title: 'Der Urknall', description: 'Die ersten Momente unseres Universums vor 13,8 Milliarden Jahren' },
    ]
  },
  {
    id: 'nature',
    name: 'Natur',
    icon: '🌿',
    ideas: [
      { title: 'Der Wald bei Nacht', description: 'Was geschieht im Wald, wenn die Menschen schlafen' },
      { title: 'Die Sprache der Bäume', description: 'Wie Bäume über Wurzeln und Pilze kommunizieren' },
      { title: 'Vogelzug', description: 'Die unglaubliche Reise der Zugvögel über Kontinente' },
      { title: 'Biolumineszenz', description: 'Lebewesen, die in der Dunkelheit leuchten' },
      { title: 'Der Wasserkreislauf', description: 'Die ewige Reise eines Wassertropfens' },
      { title: 'Nordlichter', description: 'Wie die Sonne den Himmel in Farben taucht' },
      { title: 'Jahreszeiten', description: 'Warum die Erde ihre Kleider wechselt' },
      { title: 'Wolken', description: 'Die Kunst der Wolkenbildung und ihre Geheimnisse' },
    ]
  },
  {
    id: 'ocean',
    name: 'Tiefsee',
    icon: '🌊',
    ideas: [
      { title: 'Die Mitternachtszone', description: 'Leben in der ewigen Dunkelheit der Tiefsee' },
      { title: 'Wale', description: 'Die sanften Riesen und ihre geheimnisvollen Gesänge' },
      { title: 'Korallenriffe', description: 'Unterwasserstädte voller Leben und Farben' },
      { title: 'Der Marianengraben', description: 'Eine Reise zum tiefsten Punkt der Erde' },
      { title: 'Quallen', description: 'Die ältesten Lebewesen der Meere und ihr Tanz' },
      { title: 'Meeresströmungen', description: 'Die unsichtbaren Flüsse im Ozean' },
      { title: 'Tiefsee-Vulkane', description: 'Wo neues Land unter dem Meer entsteht' },
      { title: 'Plankton', description: 'Die winzigen Helden, die unsere Luft erschaffen' },
    ]
  },
  {
    id: 'earth',
    name: 'Erde',
    icon: '🌍',
    ideas: [
      { title: 'Plattentektonik', description: 'Wie die Kontinente über den Planeten wandern' },
      { title: 'Vulkane', description: 'Fenster in das glühende Herz der Erde' },
      { title: 'Kristalle', description: 'Wie die Erde ihre Edelsteine erschafft' },
      { title: 'Höhlen', description: 'Verborgene Welten unter unseren Füßen' },
      { title: 'Die Atmosphäre', description: 'Die unsichtbare Hülle, die uns schützt' },
      { title: 'Fossilien', description: 'Geschichten aus der Urzeit, in Stein bewahrt' },
      { title: 'Gletscher', description: 'Die langsamen Riesen aus Eis und ihre Reise' },
      { title: 'Der Erdkern', description: 'Eine Reise zum Zentrum unseres Planeten' },
    ]
  },
  {
    id: 'science',
    name: 'Physik & Chemie',
    icon: '⚛️',
    ideas: [
      { title: 'Quantenwelt', description: 'Wenn Teilchen an zwei Orten gleichzeitig sein können' },
      { title: 'Licht', description: 'Die schnellste Reisende im Universum und ihre Geheimnisse' },
      { title: 'Zeit', description: 'Was ist Zeit und warum vergeht sie?' },
      { title: 'Atome', description: 'Die winzigen Bausteine, aus denen alles besteht' },
      { title: 'Magnetismus', description: 'Die unsichtbare Kraft, die Kompassnadeln tanzen lässt' },
      { title: 'Schallwellen', description: 'Wie Klänge durch die Luft reisen' },
      { title: 'Relativität', description: 'Einsteins Entdeckung, dass Zeit dehnbar ist' },
      { title: 'Chemische Reaktionen', description: 'Der Tanz der Atome, wenn Neues entsteht' },
    ]
  },
  {
    id: 'life',
    name: 'Leben & Evolution',
    icon: '🧬',
    ideas: [
      { title: 'Die erste Zelle', description: 'Wie vor Milliarden Jahren das Leben begann' },
      { title: 'DNA', description: 'Der Code des Lebens in jeder deiner Zellen' },
      { title: 'Dinosaurier', description: 'Die Herrscher, die 165 Millionen Jahre die Erde beherrschten' },
      { title: 'Das menschliche Gehirn', description: '86 Milliarden Nervenzellen und ihre Gespräche' },
      { title: 'Schlaf', description: 'Was in deinem Körper passiert, während du träumst' },
      { title: 'Fotosynthese', description: 'Wie Pflanzen Sonnenlicht in Leben verwandeln' },
      { title: 'Bakterien', description: 'Die unsichtbaren Helfer in und um uns' },
      { title: 'Evolution', description: 'Die langsame Kunst der Veränderung über Jahrmillionen' },
    ]
  }
];

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
  durationMinutes: number,
  styleId: string = 'scientific'
): Promise<string> {
  // Ungefähr 130 Wörter pro Minute beim langsamen Vorlesen
  const targetWordCount = durationMinutes * 130;

  // Finde den gewählten Stil
  const style = NARRATION_STYLES.find(s => s.id === styleId) || NARRATION_STYLES[0];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `${STORY_STYLE_PROMPT}

## Gewählter Erzählstil: ${style.name}
${style.promptAddition}`
      },
      {
        role: 'user',
        content: `Schreibe eine Einschlafgeschichte zum Thema: "${description}"

Anforderungen:
- Länge: etwa ${targetWordCount} Wörter (für ca. ${durationMinutes} Minuten)
- Erzählstil: ${style.name} - ${style.description}
- Vermittle interessantes Wissen auf beruhigende Weise
- Halte den meditativen Erzählfluss
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
  styleId: string,
  onStatusUpdate: (status: string, content?: string) => void
): Promise<{ content: string; audioPath: string }> {
  // Generiere Text mit gewähltem Stil
  onStatusUpdate('generating_text');
  const content = await generateStoryText(description, durationMinutes, styleId);
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

// Hilfsfunktion für Erzählstile
export function getNarrationStyles() {
  return NARRATION_STYLES.map(({ id, name, description, icon }) => ({ id, name, description, icon }));
}

// Hilfsfunktion für Kategorien und Ideen
export function getStoryCategories() {
  return STORY_CATEGORIES;
}

// Generiere zufällige Ideen für eine Kategorie
export function getRandomIdeasForCategory(categoryId: string, count: number = 3) {
  const category = STORY_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return [];

  const shuffled = [...category.ideas].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================
// API Test Functions
// ============================================

export interface APITestResult {
  service: string;
  status: 'ok' | 'error';
  message: string;
  details?: Record<string, unknown>;
  latency_ms?: number;
}

// Test ElevenLabs API Verbindung
export async function testElevenLabsAPI(): Promise<APITestResult> {
  const startTime = Date.now();

  // Prüfe ob API Key gesetzt ist
  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      service: 'ElevenLabs',
      status: 'error',
      message: 'ELEVENLABS_API_KEY ist nicht gesetzt',
      details: { env_var_set: false }
    };
  }

  try {
    // Versuche User-Info abzurufen (einfachster API Call)
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        parsedError = errorBody;
      }

      return {
        service: 'ElevenLabs',
        status: 'error',
        message: `API returned ${response.status}: ${response.statusText}`,
        details: {
          status_code: response.status,
          status_text: response.statusText,
          error_body: parsedError,
          api_key_prefix: process.env.ELEVENLABS_API_KEY.substring(0, 8) + '...'
        },
        latency_ms: latency
      };
    }

    const userData = await response.json() as {
      user_id?: string;
      subscription?: {
        tier?: string;
        character_count?: number;
        character_limit?: number;
      };
    };

    return {
      service: 'ElevenLabs',
      status: 'ok',
      message: 'API-Verbindung erfolgreich',
      details: {
        user_id: userData.user_id,
        subscription_tier: userData.subscription?.tier,
        character_count: userData.subscription?.character_count,
        character_limit: userData.subscription?.character_limit,
        api_key_prefix: process.env.ELEVENLABS_API_KEY!.substring(0, 8) + '...'
      },
      latency_ms: latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      service: 'ElevenLabs',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: {
        error_type: error?.constructor?.name,
        api_key_prefix: process.env.ELEVENLABS_API_KEY.substring(0, 8) + '...'
      },
      latency_ms: latency
    };
  }
}

// Test OpenAI API Verbindung
export async function testOpenAIAPI(): Promise<APITestResult> {
  const startTime = Date.now();

  if (!process.env.OPENAI_API_KEY) {
    return {
      service: 'OpenAI',
      status: 'error',
      message: 'OPENAI_API_KEY ist nicht gesetzt',
      details: { env_var_set: false }
    };
  }

  try {
    // Einfacher API Test mit minimalen Tokens
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "ok"' }],
      max_tokens: 5
    });

    const latency = Date.now() - startTime;

    return {
      service: 'OpenAI',
      status: 'ok',
      message: 'API-Verbindung erfolgreich',
      details: {
        model: response.model,
        response: response.choices[0]?.message?.content,
        api_key_prefix: process.env.OPENAI_API_KEY.substring(0, 8) + '...'
      },
      latency_ms: latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      service: 'OpenAI',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: {
        error_type: error?.constructor?.name,
        api_key_prefix: process.env.OPENAI_API_KEY?.substring(0, 8) + '...'
      },
      latency_ms: latency
    };
  }
}

// Test ob alle konfigurierten Stimmen bei ElevenLabs verfügbar sind
export async function testElevenLabsVoices(): Promise<APITestResult> {
  const startTime = Date.now();

  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      service: 'ElevenLabs Voices',
      status: 'error',
      message: 'ELEVENLABS_API_KEY ist nicht gesetzt',
      details: { env_var_set: false }
    };
  }

  try {
    // Hole alle verfügbaren Stimmen von ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        service: 'ElevenLabs Voices',
        status: 'error',
        message: `API returned ${response.status}: ${response.statusText}`,
        latency_ms: latency
      };
    }

    const data = await response.json() as {
      voices: Array<{ voice_id: string; name: string }>;
    };

    const availableVoiceIds = new Set(data.voices.map(v => v.voice_id));

    // Prüfe welche unserer konfigurierten Stimmen verfügbar sind
    const voiceStatus = AVAILABLE_VOICES.map(voice => ({
      id: voice.id,
      name: voice.name,
      available: availableVoiceIds.has(voice.id)
    }));

    const unavailableVoices = voiceStatus.filter(v => !v.available);
    const allAvailable = unavailableVoices.length === 0;

    return {
      service: 'ElevenLabs Voices',
      status: allAvailable ? 'ok' : 'error',
      message: allAvailable
        ? `Alle ${AVAILABLE_VOICES.length} Stimmen sind verfügbar`
        : `${unavailableVoices.length} von ${AVAILABLE_VOICES.length} Stimmen nicht verfügbar`,
      details: {
        configured_voices: AVAILABLE_VOICES.length,
        available_voices: voiceStatus.filter(v => v.available).length,
        unavailable: unavailableVoices,
        voice_status: voiceStatus
      },
      latency_ms: latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      service: 'ElevenLabs Voices',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
      details: {
        error_type: error?.constructor?.name
      },
      latency_ms: latency
    };
  }
}

// Teste alle APIs
export async function testAllAPIs(): Promise<APITestResult[]> {
  const results = await Promise.all([
    testElevenLabsAPI(),
    testElevenLabsVoices(),
    testOpenAIAPI()
  ]);
  return results;
}
