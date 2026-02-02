import { Injectable, signal } from '@angular/core';

export interface ConversationMessage {
  role: 'user' | 'agent';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly messages = signal<ConversationMessage[]>([]);
  readonly liveUserText = signal<string | null>(null);
  readonly liveAgentText = signal<string | null>(null);

  clear(): void {
    this.messages.set([]);
    this.liveUserText.set(null);
    this.liveAgentText.set(null);
  }

  addMessage(message: ConversationMessage): void {
    const items = this.messages();
    const last = items.length ? items[items.length - 1] : undefined;
    if (last && last.role === message.role && last.text === message.text) {
      return;
    }
    this.messages.set([...items, message]);
  }

  addSystemMessage(text: string): void {
    this.addMessage({ role: 'agent', text });
  }

  setLive(role: ConversationMessage['role'], text: string | null): void {
    if (role === 'user') {
      this.liveUserText.set(text);
      return;
    }
    this.liveAgentText.set(text);
  }

  clearLive(role: ConversationMessage['role']): void {
    this.setLive(role, null);
  }
}
