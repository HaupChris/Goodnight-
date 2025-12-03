export interface Story {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  content: string | null;
  audio_path: string | null;
  status: 'pending' | 'generating_text' | 'generating_audio' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export type View = 'home' | 'create' | 'library' | 'player';
