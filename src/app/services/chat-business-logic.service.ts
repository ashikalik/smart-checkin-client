import { Injectable } from '@angular/core';
import { QueryService } from './query.service';
import { TextToSpeechService } from './text-to-speech.service';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface ChatState {
  isSending: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
}

export interface SendQueryCallbacks {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ChatBusinessLogicService {
  private stateSubject = new Subject<ChatState>();
  public state$ = this.stateSubject.asObservable();

  private currentState: ChatState = {
    isSending: false,
    isProcessing: false,
    isSpeaking: false
  };

  private lastCommittedQuery: string = '';
  private sessionId: string = '';

  constructor(
    private queryService: QueryService,
    private ttsService: TextToSpeechService
  ) {
    this.sessionId = crypto.randomUUID();
  }

  resetSession(): void {
    this.sessionId = crypto.randomUUID();
    this.lastCommittedQuery = '';
    this.updateState({
      isSending: false,
      isProcessing: false,
      isSpeaking: false
    });
  }

  stop(): void {
    this.ttsService.stop();
    this.updateState({
      isSending: false,
      isProcessing: false,
      isSpeaking: false
    });
  }

  sendQuery(
    query: string,
    onResponse: (response: string) => void,
    onError: (error: Error) => void,
    callbacks?: SendQueryCallbacks
  ): void {
    const trimmedQuery = query.trim();

    // Validation
    if (!trimmedQuery || this.currentState.isSending) return;

    // Prevent duplicate consecutive queries
    if (trimmedQuery === this.lastCommittedQuery) {
      console.log('Duplicate query detected, skipping:', trimmedQuery);
      return;
    }

    this.lastCommittedQuery = trimmedQuery;

    this.updateState({
      isSending: true,
      isProcessing: true,
      isSpeaking: false
    });

    this.queryService
      .sendQuery(trimmedQuery, this.sessionId)
      .pipe(
        finalize(() => {
          this.updateState({ ...this.currentState, isSending: false });
        })
      )
      .subscribe({
        next: async (response) => {
          const reply = (response as { response?: string })?.response;
          if (reply) {
            onResponse(reply);

            // Speak the AI response
            try {
              this.updateState({ ...this.currentState, isSpeaking: true });
              callbacks?.onSpeakingStart?.();
              await this.ttsService.speak(reply);
            } catch (error) {
              console.error('Text-to-speech error:', error);
            } finally {
              this.updateState({
                isSending: false,
                isProcessing: false,
                isSpeaking: false
              });
              callbacks?.onSpeakingEnd?.();
            }
          } else {
            this.updateState({
              ...this.currentState,
              isProcessing: false
            });
          }
        },
        error: (error) => {
          console.error('Query service error:', error);
          onError(error);
          this.updateState({
            isSending: false,
            isProcessing: false,
            isSpeaking: false
          });
        }
      });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentState(): ChatState {
    return { ...this.currentState };
  }

  private updateState(newState: Partial<ChatState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.stateSubject.next(this.currentState);
  }
}
