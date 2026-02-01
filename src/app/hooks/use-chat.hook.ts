import { Injectable, signal, computed } from '@angular/core';
import { Message, ChatMessage } from '../types/message.types';
import { MESSAGE_SENDER, INITIAL_MESSAGE, ERROR_MESSAGE } from '../constants/messages.constants';
import { QueryService } from '../services/query.service';
import { formatTimestamp } from '../utils/date.utils';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UseChatHook {
  private messagesSignal = signal<Message[]>([{
    id: 1,
    text: INITIAL_MESSAGE,
    sender: MESSAGE_SENDER.AI,
    timestamp: formatTimestamp()
  }]);

  private isTypingSignal = signal(false);
  private sessionId = crypto.randomUUID();

  messages = computed(() => this.messagesSignal());
  isTyping = computed(() => this.isTypingSignal());

  constructor(private queryService: QueryService) {}

  addMessage(text: string, sender: 'user' | 'ai'): Message {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender,
      timestamp: formatTimestamp()
    };

    this.messagesSignal.update(messages => [...messages, newMessage]);
    return newMessage;
  }

  async sendMessage(text: string): Promise<void> {
    this.addMessage(text, MESSAGE_SENDER.USER);
    this.isTypingSignal.set(true);

    this.queryService.sendQuery(text, this.sessionId)
      .pipe(
        finalize(() => this.isTypingSignal.set(false))
      )
      .subscribe({
        next: (response) => {
          const reply = (response as { response?: string })?.response;
          if (reply) {
            this.addMessage(reply, MESSAGE_SENDER.AI);
          }
        },
        error: (error) => {
          console.error('Query service error:', error);
          this.addMessage(ERROR_MESSAGE, MESSAGE_SENDER.AI);
        }
      });
  }

  clearMessages(): void {
    this.messagesSignal.set([{
      id: 1,
      text: INITIAL_MESSAGE,
      sender: MESSAGE_SENDER.AI,
      timestamp: formatTimestamp()
    }]);
  }
}
