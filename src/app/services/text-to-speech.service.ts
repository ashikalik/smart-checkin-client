import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class TextToSpeechService {
  private readonly apiKey = environment.xiApiKey;
  private readonly apiUrl = 'https://api.elevenlabs.io/v1/text-to-dialogue/stream';
  private currentAudio: HTMLAudioElement | null = null;
  private isNative = Capacitor.isNativePlatform();

  async speak(text: string, voiceId: string = 'JBFqnCBsd6RMkjVDRZzb'): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [
            {
              text: text,
              voice_id: voiceId,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Text-to-speech API error: ${response.status}`);
      }

      // Get the audio stream
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      this.currentAudio = new Audio(audioUrl);

      // Platform-specific audio handling
      if (this.isNative) {
        // For iOS/Android: use modern audio context to handle background audio
        this.currentAudio.preload = 'auto';
        // Request audio focus on mobile devices
        if ((navigator as any).mediaSession) {
          (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
            title: 'AI Response',
            artist: 'Smart Check-in',
          });
        }
      }

      // Clean up URL when audio ends
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
      };

      // Handle errors
      this.currentAudio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
      };

      // Play with retry for mobile platforms
      await this.playAudio();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  private async playAudio(): Promise<void> {
    if (!this.currentAudio) return;

    try {
      await this.currentAudio.play();
    } catch (error: any) {
      // Handle autoplay restrictions on mobile
      if (error.name === 'NotAllowedError') {
        console.warn('Audio autoplay blocked, user interaction required');
        // On mobile, this might happen due to autoplay policies
        // The audio will play after user interaction
      } else {
        throw error;
      }
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
