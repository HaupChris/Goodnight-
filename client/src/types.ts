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

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  preview_url: string | null;
}

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  file: string;
}

export type View = 'home' | 'create' | 'library' | 'player';
