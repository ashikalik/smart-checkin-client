export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
