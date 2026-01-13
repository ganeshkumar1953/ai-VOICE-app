
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string;
  urls?: Array<{title: string, uri: string}>;
}

export enum AppTab {
  LIVE = 'live',
  SEARCH = 'search',
  THINKING = 'thinking',
  TRANSCRIPTION = 'transcription'
}
