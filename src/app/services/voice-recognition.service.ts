import { Injectable } from '@angular/core';
import { Scribe, RealtimeEvents, RealtimeConnection } from '@elevenlabs/client';
import { environment } from '../../environments/environment';

export interface VoiceRecognitionCallbacks {
  onSessionStarted?: () => void;
  onPartialTranscript?: (text: string) => void;
  onCommittedTranscript?: (text: string) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  private connection: RealtimeConnection | null = null;
  private token: any = null;
  private tokenGenerationTime: number = 0;
  private readonly tokenExpirySeconds = 15 * 60;
  private tokenGenerationPromise: Promise<void> | null = null;
  private callbacks: VoiceRecognitionCallbacks = {};

  async startSession(callbacks: VoiceRecognitionCallbacks): Promise<void> {
    this.callbacks = callbacks;

    if (this.connection) {
      console.log('Forcing cleanup of existing connection');
      this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Generate fresh token
    await this.generateToken();

    const tokenString =
      typeof this.token === 'string'
        ? this.token
        : (this.token as { token?: string } | null)?.token;

    if (!tokenString) {
      throw new Error('Failed to obtain token');
    }

    this.connect(tokenString);
  }

  disconnect(): void {
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

  commit(): void {
    if (this.connection) {
      try {
        this.connection.commit();
        console.log('Transcript committed');
      } catch (error) {
        console.error('Error committing transcript:', error);
      }
    }
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      // For Android/iOS
      if ((window as any).Capacitor?.isNativePlatform()) {
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

      // For web
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media devices not supported');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }

  private async generateToken(): Promise<void> {
    if (this.tokenGenerationPromise) {
      return this.tokenGenerationPromise;
    }

    this.tokenGenerationPromise = (async () => {
      try {
        console.log('Generating new token...');
        const response = await fetch(environment.elevenlabsTokenUrl);

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

  private subscribeEvents(): void {
    if (!this.connection) return;

    if (this.callbacks.onSessionStarted) {
      this.connection.on(RealtimeEvents.SESSION_STARTED, this.callbacks.onSessionStarted);
    }
    if (this.callbacks.onPartialTranscript) {
      this.connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data: any) => {
        this.callbacks.onPartialTranscript?.(data.text);
      });
    }
    if (this.callbacks.onCommittedTranscript) {
      this.connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS, (data: any) => {
        this.callbacks.onCommittedTranscript?.(data.text);
      });
    }
    if (this.callbacks.onError) {
      this.connection.on(RealtimeEvents.ERROR, this.callbacks.onError);
    }
    if (this.callbacks.onOpen) {
      this.connection.on(RealtimeEvents.OPEN, this.callbacks.onOpen);
    }
    if (this.callbacks.onClose) {
      this.connection.on(RealtimeEvents.CLOSE, this.callbacks.onClose);
    }
  }

  private unsubscribeEvents(): void {
    if (!this.connection) return;

    if (this.callbacks.onSessionStarted) {
      this.connection.off(RealtimeEvents.SESSION_STARTED, this.callbacks.onSessionStarted);
    }
    if (this.callbacks.onPartialTranscript) {
      this.connection.off(RealtimeEvents.PARTIAL_TRANSCRIPT, this.callbacks.onPartialTranscript as any);
    }
    if (this.callbacks.onCommittedTranscript) {
      this.connection.off(RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS, this.callbacks.onCommittedTranscript as any);
    }
    if (this.callbacks.onError) {
      this.connection.off(RealtimeEvents.ERROR, this.callbacks.onError);
    }
    if (this.callbacks.onOpen) {
      this.connection.off(RealtimeEvents.OPEN, this.callbacks.onOpen);
    }
    if (this.callbacks.onClose) {
      this.connection.off(RealtimeEvents.CLOSE, this.callbacks.onClose);
    }
  }
}
