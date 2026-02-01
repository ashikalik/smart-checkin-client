import { Injectable, signal, computed } from '@angular/core';
import { Conversation } from "@elevenlabs/client";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UseVoiceHook {
  private isConnectedSignal = signal(false);
  private isSpeakingSignal = signal(false);
  private conversation: Conversation | null = null;
  private sessionId: string | null = null;

  isConnected = computed(() => this.isConnectedSignal());
  isSpeaking = computed(() => this.isSpeakingSignal());

  private onMessageCallback: ((role: string, message: string) => void) | null = null;

  async startConversation(onMessage: (role: string, message: string) => void): Promise<void> {
    if (this.isConnectedSignal()) return;

    this.onMessageCallback = onMessage;
    this.sessionId = crypto.randomUUID();

    try {
      const signedUrl = await this.getSignedUrl();

      this.conversation = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          console.log("Connected to conversation");
          this.isConnectedSignal.set(true);
        },
        onDisconnect: () => {
          console.log("Disconnected from conversation");
          this.isConnectedSignal.set(false);
          this.isSpeakingSignal.set(false);
        },
        onMessage: (message) => {
          console.log("Message:", message);
          if (this.onMessageCallback && message.message) {
            this.onMessageCallback(message.source, message.message);
          }
        },
        onError: (error) => {
          console.error("Conversation error:", error);
        },
        onModeChange: (mode) => {
          console.log("Mode changed:", mode);
          this.isSpeakingSignal.set(mode.mode === 'speaking');
        }
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      throw error;
    }
  }

  endConversation(): void {
    if (this.conversation) {
      this.conversation.endSession();
      this.conversation = null;
    }
    this.isConnectedSignal.set(false);
    this.isSpeakingSignal.set(false);
    this.sessionId = null;
  }

  async setVolume(volume: number): Promise<void> {
    if (this.conversation) {
      await this.conversation.setVolume({ volume });
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private async getSignedUrl(): Promise<string> {
    const response = await fetch(environment.elevenlabsTokenUrl);
    const data = await response.json();
    return data.signedUrl || data.signed_url;
  }
}
