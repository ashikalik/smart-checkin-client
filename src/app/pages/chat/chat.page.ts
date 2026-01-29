import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ChatHeaderComponent } from '../../components/chat-header/chat-header.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ChatInputComponent } from '../../components/chat-input/chat-input.component';
import { UseChatHook } from '../../hooks/use-chat.hook';
import { INPUT_PLACEHOLDER } from '../../constants/messages.constants';
import { Scribe, RealtimeEvents, RealtimeConnection } from '@elevenlabs/client';
import { finalize } from 'rxjs';
import { QueryService } from '../../services/query.service';

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

  public chatHook = inject(UseChatHook);
  private queryService = inject(QueryService);

  private token!: RealtimeConnection | null;
  private connection!: RealtimeConnection | null;
  private tokenGenerationTime: number = 0;
  private readonly tokenExpirySeconds = 15 * 60;
  public currentQuery: string = '';
  public queryRepeatCount: number = 0;
  public isListening: boolean = false;
  public isSending: boolean = false;
  private sessionId: string = '';
  private isConnecting: boolean = false;
  private tokenGenerationPromise: Promise<void> | null = null;

  // Event handlers
  private onSessionStarted = () => {
    console.log('Session started');
  };

  private onPartialTranscript = (data: any) => {
    console.log('Partial:', data.text);
    this.setQuery(data.text);
  };

  private onCommittedTranscript = (data: any) => {
    console.log('Committed:', data.text);
    this.commitQuery(data.text);
  };

  private onError = (error: any) => {
    console.error('Scribe connection error:', error);
    this.isListening = false;
    this.isConnecting = false;
    if (this.connection) {
      this.disconnect();
    }
  };

  private onOpen = () => {
    console.log('Connection opened');
  };

  private onClose = () => {
    console.log('Connection closed');
    this.isListening = false;
    this.isConnecting = false;
  };

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  ngOnInit(): void {
    // Initialization handled by hooks
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  handleSendMessage(): void {
    if (this.inputText.trim()) {
      this.chatHook.sendMessage(this.inputText);
      this.inputText = '';
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
      const hasPermission = await this.checkMicrophonePermission();
      if (!hasPermission) {
        this.chatHook.addMessage(
          'Microphone access is required for voice support. Please enable it in your device settings.',
          'ai',
        );
        this.isListening = false;
        this.isConnecting = false;
        return;
      }

      await this.startSession();
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
    this.isListening = false;
    this.isConnecting = false;

    if (this.connection) {
      this.commit();
      // Delay disconnect to allow commit to process
      setTimeout(() => this.disconnect(), 500);
    }
  }

  private async startSession(): Promise<void> {
    // Disconnect any existing connection first
    if (this.connection) {
      this.disconnect();
      // Wait a bit to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Always generate a fresh token for new sessions
    await this.generateToken();

    const token =
      typeof this.token === 'string'
        ? this.token
        : (this.token as { token?: string } | null)?.token;

    if (!token) {
      throw new Error('Failed to obtain token');
    }

    this.connect(token);
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      // For Android/iOS, use Capacitor's permission check first
      if ((window as any).Capacitor?.isNativePlatform()) {
        const { Capacitor } = await import('@capacitor/core');

        // Request microphone permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          console.log('Microphone permission granted');
          return true;
        } catch (error: any) {
          console.error('Microphone permission denied:', error);
          return false;
        }
      }

      // For web, check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media devices not supported');
        return false;
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // If successful, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());

      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }

  private async generateToken(): Promise<void> {
    // Prevent concurrent token generation
    if (this.tokenGenerationPromise) {
      return this.tokenGenerationPromise;
    }

    this.tokenGenerationPromise = (async () => {
      try {
        console.log('Generating new token...');
        const response = await fetch(
          'https://n8n.srv1232458.hstgr.cloud/webhook/0d1d4ee5-7ef4-4d11-83ea-aca2e271feb1',
        );

        if (!response.ok) {
          throw new Error(`Token generation failed: ${response.status}`);
        }

        this.token = await response.json();
        this.tokenGenerationTime = Math.floor(Date.now() / 1000);
        console.log('Token generated successfully');
      } catch (error) {
        console.error('Token generation error:', error);
        throw error;
      } finally {
        this.tokenGenerationPromise = null;
      }
    })();

    return this.tokenGenerationPromise;
  }

  private getTokenLife(): number {
    if (!this.tokenGenerationTime) return 0;
    const elapsed = Math.floor(Date.now() / 1000) - this.tokenGenerationTime;
    return Math.max(0, this.tokenExpirySeconds - elapsed);
  }

  private connect(token: string): void {
    try {
      console.log('Connecting to Scribe...');
      this.connection = Scribe.connect({
        token,
        modelId: 'scribe_v2_realtime',
        includeTimestamps: true,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.subscribeEvents();
    } catch (error) {
      console.error('Failed to establish connection:', error);
      throw error;
    }
  }

  private disconnect(): void {
    if (this.connection) {
      try {
        this.unsubscribeEvents();
        this.connection.commit();
        this.connection.close();
        console.log('Connection closed and cleaned up');
      } catch (error) {
        console.error('Error during disconnect:', error);
      } finally {
        this.connection = null;
      }
    }
  }

  private commit(): void {
    if (this.connection) {
      try {
        this.connection.commit();
        console.log('Transcript committed');
      } catch (error) {
        console.error('Error committing transcript:', error);
      }
    }
  }

  private setQuery(query: string): void {
    if (query === this.currentQuery) {
      this.queryRepeatCount++;
    }
    if (this.queryRepeatCount > 1) {
      this.commit();
    }
    this.currentQuery = query;
    this.inputText = query;
  }

  private commitQuery(query: string): void {
    if (this.isSending || !query.trim()) return;

    this.chatHook.addMessage(query, 'user');
    this.inputText = '';
    this.currentQuery = '';
    this.queryRepeatCount = 0;

    this.isSending = true;
    this.queryService
      .sendQuery(query, this.sessionId)
      .pipe(
        finalize(() => {
          this.isSending = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const reply = (response as { response?: string })?.response;
          if (reply) {
            this.chatHook.addMessage(reply, 'ai');
          }
        },
        error: (error) => {
          console.error('Query service error:', error);
          this.chatHook.addMessage(
            'Sorry, I encountered an error. Please try again.',
            'ai',
          );
        },
      });
  }

  private subscribeEvents(): void {
    if (!this.connection) return;

    this.connection.on(RealtimeEvents.SESSION_STARTED, this.onSessionStarted);
    this.connection.on(
      RealtimeEvents.PARTIAL_TRANSCRIPT,
      this.onPartialTranscript,
    );
    this.connection.on(
      RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS,
      this.onCommittedTranscript,
    );
    this.connection.on(RealtimeEvents.ERROR, this.onError);
    this.connection.on(RealtimeEvents.OPEN, this.onOpen);
    this.connection.on(RealtimeEvents.CLOSE, this.onClose);
  }

  private unsubscribeEvents(): void {
    if (!this.connection) return;

    this.connection.off(RealtimeEvents.SESSION_STARTED, this.onSessionStarted);
    this.connection.off(
      RealtimeEvents.PARTIAL_TRANSCRIPT,
      this.onPartialTranscript,
    );
    this.connection.off(
      RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS,
      this.onCommittedTranscript,
    );
    this.connection.off(RealtimeEvents.ERROR, this.onError);
    this.connection.off(RealtimeEvents.OPEN, this.onOpen);
    this.connection.off(RealtimeEvents.CLOSE, this.onClose);
  }
}
