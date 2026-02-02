import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonFooter,
  IonBadge,
  IonIcon,
} from '@ionic/angular/standalone';
import { Conversation } from '@elevenlabs/client';
import type { MessagePayload, Mode, Status } from '@elevenlabs/types';
import { addIcons } from 'ionicons';
import { playCircle, stopCircle, volumeHigh } from 'ionicons/icons';

interface ConversationMessage {
  role: 'user' | 'agent';
  text: string;
}

@Component({
  selector: 'app-agent',
  templateUrl: './agent.page.html',
  styleUrls: ['./agent.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonFooter,
    IonBadge,
    IonIcon,
  ],
})
export class AgentPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;

  private readonly sessionStorageKey = 'smart-checkin-session-id';
  readonly agentId = 'agent_4101kga7dg1cecjadpd4h4mtg1e5';
  readonly apiUrl = '/api/main/run';

  conversation: Conversation | null = null;
  conversationId = '';
  sessionId = '';
  status: Status = 'disconnected';
  mode: Mode | null = null;
  canSendFeedback = false;
  isConnecting = false;
  isSending = false;
  private lastHandledUserMessage = '';
  private pendingSpeakText: string | null = null;

  messages: ConversationMessage[] = [];
  inputText = '';

  constructor() { }

  ngOnInit(): void {
    addIcons({ playCircle, stopCircle, volumeHigh });
    this.sessionId = sessionStorage.getItem(this.sessionStorageKey) ?? '';
  }

  ngOnDestroy(): void {
    void this.endSession();
  }

  get statusColor(): string {
    switch (this.status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'disconnecting':
        return 'medium';
      case 'disconnected':
      default:
        return 'light';
    }
  }

  async startSession(): Promise<void> {
    if (this.isConnecting || this.conversation?.isOpen()) {
      return;
    }

    this.messages = [];
    this.sessionId = '';
    sessionStorage.removeItem(this.sessionStorageKey);
    this.isConnecting = true;

    try {
      const hasPermission = await this.checkMicrophonePermission();
      if (!hasPermission) {
        this.addSystemMessage('Microphone access is required to start the agent session.');
        return;
      }

      this.conversation = await Conversation.startSession({
        agentId: this.agentId,
        connectionType: 'websocket',
        onConnect: ({ conversationId }) => {
          this.conversationId = conversationId;
        },
        onDisconnect: (details) => {
          this.status = 'disconnected';
          this.mode = null;
          this.canSendFeedback = false;
          if (details.reason === 'error') {
            this.addSystemMessage(`Disconnected due to error: ${details.message}`);
          }
        },
        onError: (message) => {
          console.error('Agent session error:', message);
          this.addSystemMessage(`Agent error: ${message}`);
        },
        onMessage: (payload: MessagePayload) => {
          console.log(payload);
          this.handleMessage(payload);
        },
        onModeChange: ({ mode }) => {
          this.mode = mode;
          if (mode === 'listening') {
            this.trySendSpeakPrompt();
          }
        },
        onStatusChange: ({ status }) => {
          this.status = status;
        },
        onCanSendFeedbackChange: ({ canSendFeedback }) => {
          this.canSendFeedback = canSendFeedback;
        },
      });

      this.conversation.sendContextualUpdate(
        'System override: Do NOT speak or respond unless explicitly instructed with "Speak exactly: ...". ' +
        'If no such instruction is present, remain silent.'
      );
    } catch (error) {
      console.error('Failed to start agent session:', error);
      this.addSystemMessage('Failed to start the agent session. Please try again.');
    } finally {
      this.isConnecting = false;
    }
  }

  async endSession(): Promise<void> {
    if (!this.conversation) {
      return;
    }

    try {
      await this.conversation.endSession();
    } catch (error) {
      console.error('Failed to end agent session:', error);
    } finally {
      this.conversation = null;
      this.status = 'disconnected';
      this.mode = null;
      this.canSendFeedback = false;
      this.conversationId = '';
    }
  }

  sendMessage(): void {
    const trimmed = this.inputText.trim();
    if (!trimmed || this.isSending) {
      return;
    }

    if (!this.conversation?.isOpen()) {
      void this.startSession();
    }

    this.addMessage({ role: 'user', text: trimmed });
    this.inputText = '';
    this.lastHandledUserMessage = trimmed;
    void this.handleApiTurn(trimmed);
  }

  toggleSession(): void {
    if (this.status === 'connected' || this.status === 'connecting') {
      void this.endSession();
      return;
    }
    void this.startSession();
  }

  private handleMessage(payload: MessagePayload): void {
    const message = payload.message?.trim();
    if (!message) {
      return;
    }
    if (/^\.*$/.test(message) || /^\u2026+$/.test(message)) {
      return;
    }

    const last = this.messages[this.messages.length - 1];
    if (last && last.role === payload.role && last.text === message) {
      return;
    }

    this.addMessage({ role: payload.role, text: message });

    if (payload.role === 'user' && !this.isSending) {
      if (message !== this.lastHandledUserMessage) {
        this.lastHandledUserMessage = message;
        void this.handleApiTurn(message);
      }
    }
  }

  private addMessage(message: ConversationMessage): void {
    const recent = this.messages.slice(-5);
    if (recent.some((item) => item.role === message.role && item.text === message.text)) {
      return;
    }
    this.messages = [...this.messages, message];
    this.scrollToBottom();
  }

  private addSystemMessage(text: string): void {
    this.addMessage({ role: 'agent', text });
  }

  private async handleApiTurn(goal: string): Promise<void> {
    this.isSending = true;
    try {
      const reply = await this.callCheckinApi(goal);
      console.log("reply");
      console.log(reply);
      const userMessage = reply.userMessage;
      if (userMessage) {
        if (this.conversation?.isOpen()) {
          this.pendingSpeakText = userMessage;
          this.trySendSpeakPrompt();
        } else {
          this.addMessage({ role: 'agent', text: userMessage });
        }
      } else {
         if (this.conversation?.isOpen()) {
          this.pendingSpeakText = 'Please wait while I fetch your information';
          this.trySendSpeakPrompt();
        } else {
          this.addSystemMessage('Please wait while I fetch your information');
        }
      }
    } catch (error) {
      console.error('Check-in API error:', error);
      this.addSystemMessage('Failed to reach the check-in service.');
    } finally {
      this.isSending = false;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.content?.scrollToBottom(250);
    }, 50);
  }

  private trySendSpeakPrompt(): void {
    if (!this.pendingSpeakText || !this.conversation?.isOpen()) {
      return;
    }
    if (this.mode === 'speaking') {
      return;
    }
    if (this.pendingSpeakText) {
      const text = this.pendingSpeakText;
      this.pendingSpeakText = null;
      this.conversation?.sendUserMessage(`Say exactly the following sentence and nothing else: "${text}"`);
      setTimeout(() => {
        this.addMessage({ role: 'agent', text });
      }, 300);
    }
  }



  private async callCheckinApi(goal: string): Promise<{ userMessage: string; raw: unknown }> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goal,
        sessionId: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      reply?: string;
      message?: string;
      response?: string;
      userMessage?: string;
      sessionId?: string;
    };

    if (data.sessionId) {
      this.sessionId = data.sessionId;
      sessionStorage.setItem(this.sessionStorageKey, data.sessionId);
    }

    const userMessage = data.userMessage ?? data.reply ?? data.message ?? data.response ?? '';
    return { userMessage, raw: data };
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
