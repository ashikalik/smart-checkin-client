import { Injectable, signal } from '@angular/core';
import { Conversation } from '@elevenlabs/client';
import type { MessagePayload, Mode, Status } from '@elevenlabs/types';
import { environment } from '../../../environments/environment';

interface SessionCallbacks {
  onMessage: (payload: MessagePayload) => void;
  onError: (message: string) => void;
  onDisconnect: (details: { reason: 'error' | 'agent' | 'user'; message?: string }) => void;
  onModeChange?: (mode: Mode) => void;
}

@Injectable({ providedIn: 'root' })
export class AgentSessionService {
  private conversation: Conversation | null = null;

  readonly status = signal<Status>('disconnected');
  readonly mode = signal<Mode | null>(null);
  readonly canSendFeedback = signal(false);
  readonly conversationId = signal('');

  isOpen(): boolean {
    return Boolean(this.conversation?.isOpen());
  }

  async startSession(callbacks: SessionCallbacks): Promise<void> {
    if (this.conversation?.isOpen()) {
      return;
    }

    const hasPermission = await this.checkMicrophonePermission();
    if (!hasPermission) {
      throw new Error('Microphone permission denied.');
    }

    const agentId = environment.elevenlabsAgentId;
    if (!agentId) {
      throw new Error('Missing ElevenLabs agent id.');
    }

    this.conversation = await Conversation.startSession({
      agentId,
      connectionType: 'websocket',
      onConnect: ({ conversationId }) => {
        this.conversationId.set(conversationId ?? '');
      },
      onDisconnect: (details) => {
        this.status.set('disconnected');
        this.mode.set(null);
        this.canSendFeedback.set(false);
        callbacks.onDisconnect(details as { reason: 'error' | 'agent' | 'user'; message?: string });
      },
      onError: (message) => {
        callbacks.onError(message);
      },
      onMessage: (payload) => {
        callbacks.onMessage(payload);
      },
      onModeChange: ({ mode }) => {
        this.mode.set(mode);
        callbacks.onModeChange?.(mode);
      },
      onStatusChange: ({ status }) => {
        this.status.set(status);
      },
      onCanSendFeedbackChange: ({ canSendFeedback }) => {
        this.canSendFeedback.set(canSendFeedback);
      },
    });
  }

  async endSession(): Promise<void> {
    if (!this.conversation) {
      return;
    }

    try {
      await this.conversation.endSession();
    } finally {
      this.conversation = null;
      this.status.set('disconnected');
      this.mode.set(null);
      this.canSendFeedback.set(false);
      this.conversationId.set('');
    }
  }

  sendUserMessage(text: string): void {
    this.conversation?.sendUserMessage(text);
  }

  sendContextualUpdate(text: string): void {
    this.conversation?.sendContextualUpdate(text);
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('Media devices not supported');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }
}
