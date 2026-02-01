import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ChatHeaderComponent } from '../../components/chat-header/chat-header.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ChatInputComponent } from '../../components/chat-input/chat-input.component';
import { UseChatHook } from '../../hooks/use-chat.hook';
import { INPUT_PLACEHOLDER } from '../../constants/messages.constants';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';
import { ChatBusinessLogicService } from '../../services/chat-business-logic.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ChatHeaderComponent,
    MessageListComponent,
    ChatInputComponent,
  ],
})
export class ChatPage implements OnInit, OnDestroy {
  inputText: string = '';
  readonly placeholder = INPUT_PLACEHOLDER;

  public chatHook: UseChatHook;
  private voiceService: VoiceRecognitionService;
  private chatLogicService: ChatBusinessLogicService;

  public currentQuery: string = '';
  public queryRepeatCount: number = 0;
  public isListening: boolean = false;
  public isSending: boolean = false;
  public isSpeaking: boolean = false;
  public isProcessing: boolean = false;
  private isConnecting: boolean = false;
  private commitDebounceTimeout: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private connectionTimeout: any = null;
  private stateSubscription?: Subscription;

  // Event handlers
  private onSessionStarted = () => {
    console.log('Session started');
  };

  private onPartialTranscript = (text: string) => {
    console.log('Partial:', text);
    this.setQuery(text);
  };

  private onCommittedTranscript = (text: string) => {
    console.log('Committed:', text);
    this.commitQuery(text);
  };

  private onError = (error: any) => {
    console.error('Scribe connection error:', error);
    this.isListening = false;
    this.isConnecting = false;

    this.voiceService.disconnect();

    // Attempt reconnection if within retry limit
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        if (!this.isListening && !this.isConnecting) {
          console.log('Auto-reconnection skipped - not in active session');
        }
      }, 2000);
    } else {
      console.error('Max reconnection attempts reached');
      this.chatHook.addMessage(
        'Connection lost. Please try again.',
        'ai',
      );
    }
  };

  private onOpen = () => {
    console.log('Connection opened');
    this.reconnectAttempts = 0;
  };

  private onClose = () => {
    console.log('Connection closed');
    this.isListening = false;
    this.isConnecting = false;
  };

  constructor(
    chatHook: UseChatHook,
    voiceService: VoiceRecognitionService,
    chatLogicService: ChatBusinessLogicService
  ) {
    this.chatHook = chatHook;
    this.voiceService = voiceService;
    this.chatLogicService = chatLogicService;
  }

  ngOnInit(): void {
    // Subscribe to chat state updates
    this.stateSubscription = this.chatLogicService.state$.subscribe((state) => {
      this.isSending = state.isSending;
      this.isProcessing = state.isProcessing;
    });
  }

  ngOnDestroy(): void {
    if (this.commitDebounceTimeout) {
      clearTimeout(this.commitDebounceTimeout);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.voiceService.disconnect();
    this.chatLogicService.stop();
    this.stateSubscription?.unsubscribe();
  }

  clearChat(): void {
    this.chatHook.clearMessages();
    this.inputText = '';
    this.currentQuery = '';
    this.queryRepeatCount = 0;
    this.reconnectAttempts = 0;
    if (this.commitDebounceTimeout) {
      clearTimeout(this.commitDebounceTimeout);
    }
    // Reset session for new conversation
    this.chatLogicService.resetSession();
  }

  handleSendMessage(): void {
    if (this.inputText.trim()) {
      const message = this.inputText.trim();
      this.inputText = ''; // Clear input immediately

      // Add user message to chat
      this.chatHook.addMessage(message, 'user');

      // Use chat business logic service for TTS integration
      this.chatLogicService.sendQuery(
        message,
        (response: string) => {
          this.chatHook.addMessage(response, 'ai');
        },
        (error: Error) => {
          console.error('Query error:', error);
          this.chatHook.addMessage(
            'Failed to send message. Please try again.',
            'ai',
          );
        },
        {
          onSpeakingStart: () => {
            this.isSpeaking = true;
          },
          onSpeakingEnd: () => {
            this.isSpeaking = false;
            this.isProcessing = false;
          }
        }
      );
    }
  }

  async handleVoiceStart(): Promise<void> {
    if (this.isListening || this.isSending || this.isConnecting) {
      console.log('Already processing voice input');
      return;
    }

    this.isConnecting = true;
    this.currentQuery = '';
    this.queryRepeatCount = 0;

    try {
      // Check microphone permissions first
      const hasPermission = await this.voiceService.checkMicrophonePermission();
      if (!hasPermission) {
        this.chatHook.addMessage(
          'Microphone access is required for voice support. Please enable it in your device settings.',
          'ai',
        );
        this.isListening = false;
        this.isConnecting = false;
        return;
      }

      // Start voice session with callbacks
      const callbacks = {
        onSessionStarted: this.onSessionStarted,
        onPartialTranscript: this.onPartialTranscript,
        onCommittedTranscript: this.onCommittedTranscript,
        onError: this.onError,
        onOpen: this.onOpen,
        onClose: this.onClose
      };

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.log('Connection timeout - no audio detected after 10 seconds');
        this.handleVoiceEnd();
      }, 10000);

      await this.voiceService.startSession(callbacks);
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
        this.chatHook.addMessage(
          'Microphone access denied. Please allow microphone access to use voice support.',
          'ai',
        );
      } else {
        this.chatHook.addMessage(
          'Failed to connect to voice service. Please try again.',
          'ai',
        );
      }
      this.isListening = false;
    } finally {
      this.isConnecting = false;
    }
  }

  handleVoiceEnd(): void {
    if (!this.isListening && !this.isConnecting) return;

    console.log('Voice input ended');
    this.isListening = false;
    this.isConnecting = false;

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.voiceService.commit();

    // Delay disconnect to allow commit to process
    setTimeout(() => {
      this.voiceService.disconnect();
      // Force reset listening state
      this.isListening = false;
    }, 500);
  }

  private setQuery(query: string): void {
    if (!query.trim()) return;

    if (query === this.currentQuery) {
      this.queryRepeatCount++;
    } else {
      this.currentQuery = query;
      this.queryRepeatCount = 0;
    }

    this.inputText = query;

    // Debounce auto-commit to prevent rapid commits
    if (this.commitDebounceTimeout) {
      clearTimeout(this.commitDebounceTimeout);
    }

    if (this.queryRepeatCount > 2) {
      this.commitDebounceTimeout = setTimeout(() => {
        this.voiceService.commit();
      }, 500);
    }
  }

  private commitQuery(query: string): void {
    const trimmedQuery = query.trim();

    // Prevent sending if already sending or query is empty
    if (this.isSending || !trimmedQuery) return;

    this.chatHook.addMessage(trimmedQuery, 'user');
    this.inputText = '';
    this.currentQuery = '';
    this.queryRepeatCount = 0;

    // Use chat business logic service
    this.chatLogicService.sendQuery(
      trimmedQuery,
      (response: string) => {
        this.chatHook.addMessage(response, 'ai');
      },
      (error: Error) => {
        console.error('Query error:', error);
        this.chatHook.addMessage(
          'Failed to send message. Please try again.',
          'ai',
        );
      },
      {
        onSpeakingStart: () => {
          this.isSpeaking = true;
        },
        onSpeakingEnd: () => {
          this.isSpeaking = false;
          this.isProcessing = false;
        }
      }
    );
  }
}
