import { Injectable, signal } from '@angular/core';
import type { MessagePayload, Mode } from '@elevenlabs/types';
import { AgentSessionService } from './agent-session.service';
import { ChatService } from './chat.service';
import { CheckinApiService } from './checkin-api.service';
import { JourneyCardFormatterService } from './journey-card-formatter.service';
import { JourneyCardData } from './journey-card.types';
import { PassengerCardFormatterService } from './passenger-card-formatter.service';
import { PassengerCardData } from './passenger-card.types';
import { BoardingPassFormatterService } from './boarding-pass-formatter.service';
import { BoardingPassCardData } from './boarding-pass.types';

@Injectable({ providedIn: 'root' })
export class VoiceAgentService {
  private lastHandledUserMessage = '';
  private pendingSpeakText: string | null = null;
  private lastMode: Mode | null = null;
  private lastFinalizedUserText = '';
  private lastFinalizedAgentText = '';
  private pendingAgentFinalText: string | null = null;
  private hasSpokenForTurn = false;
  private agentMessageStreak = 0;

  readonly isConnecting = signal(false);
  readonly isSending = signal(false);
  readonly journeyCard = signal<JourneyCardData | null>(null);

  constructor(
    private readonly agentSession: AgentSessionService,
    private readonly chat: ChatService,
    private readonly checkinApi: CheckinApiService,
    private readonly journeyCardFormatter: JourneyCardFormatterService,
    private readonly passengerCardFormatter: PassengerCardFormatterService,
    private readonly boardingPassFormatter: BoardingPassFormatterService
  ) {}

  readonly messages = this.chat.messages;
  readonly liveUserText = this.chat.liveUserText;
  readonly liveAgentText = this.chat.liveAgentText;
  readonly status = this.agentSession.status;
  readonly mode = this.agentSession.mode;
  readonly canSendFeedback = this.agentSession.canSendFeedback;
  readonly conversationId = this.agentSession.conversationId;

  init(): void {
    this.checkinApi.init();
  }

  async startSession(): Promise<void> {
    if (this.isConnecting() || this.agentSession.isOpen()) {
      return;
    }

    this.chat.clear();
    this.checkinApi.clearSession();
    this.isConnecting.set(true);
    this.journeyCard.set(null);
    this.lastMode = null;
    this.lastFinalizedUserText = '';
    this.lastFinalizedAgentText = '';
    this.pendingAgentFinalText = null;
    this.hasSpokenForTurn = false;
    this.agentMessageStreak = 0;

    try {
      await this.agentSession.startSession({
        onMessage: (payload) => {
          this.handleMessage(payload);
        },
        onError: (message) => {
          console.error('Agent session error:', message);
          this.chat.addSystemMessage(`Agent error: ${message}`);
        },
        onModeChange: (mode) => {
          this.handleModeChange(mode);
          if (mode === 'listening') {
            this.trySendSpeakPrompt();
          }
        },
        onDisconnect: (details) => {
          if (details.reason === 'error') {
            this.chat.addSystemMessage(`Disconnected due to error: ${details.message}`);
          }
          this.chat.clearLive('user');
          this.chat.clearLive('agent');
        },
      });

      this.agentSession.sendContextualUpdate(
        'System override: Do NOT speak or respond unless explicitly instructed with "Speak exactly: ...". ' +
          'If no such instruction is present, remain silent.'
      );
    } catch (error) {
      console.error('Failed to start agent session:', error);
      this.chat.addSystemMessage('Failed to start the agent session. Please try again.');
    } finally {
      this.isConnecting.set(false);
    }
  }

  async endSession(): Promise<void> {
    await this.agentSession.endSession();
    this.journeyCard.set(null);
  }

  toggleSession(): void {
    if (this.agentSession.status() === 'connected' || this.agentSession.status() === 'connecting') {
      void this.endSession();
      return;
    }
    void this.startSession();
  }

  sendUserText(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.isSending()) {
      return;
    }

    if (!this.agentSession.isOpen()) {
      void this.startSession();
    }

    this.chat.addMessage({ role: 'user', text: trimmed, type: 'text' });
    this.lastHandledUserMessage = trimmed;
    this.agentMessageStreak = 0;
    void this.handleApiTurn(trimmed);
  }

  private handleMessage(payload: MessagePayload): void {
    const message = payload.message?.trim();
    if (!message) {
      return;
    }
    if (/^\.*$/.test(message) || /^\u2026+$/.test(message)) {
      return;
    }

    if (payload.role === 'user' && this.agentSession.mode() === 'listening') {
      this.chat.setLive('user', message);
      return;
    }

    if (payload.role === 'agent' && this.agentSession.mode() === 'speaking') {
      this.pendingAgentFinalText = message;
      this.chat.setLive('agent', '');
      return;
    }

    if (payload.role === 'user' && message === this.lastFinalizedUserText) {
      this.lastFinalizedUserText = '';
      return;
    }

    if (payload.role === 'agent' && message === this.lastFinalizedAgentText) {
      this.lastFinalizedAgentText = '';
      return;
    }

    this.chat.addMessage({ role: payload.role, text: message, type: 'text' });

    if (payload.role === 'user' && !this.isSending()) {
      if (message !== this.lastHandledUserMessage) {
        this.lastHandledUserMessage = message;
        this.agentMessageStreak = 0;
        void this.handleApiTurn(message);
      }
    }
  }

  private async handleApiTurn(goal: string): Promise<void> {
    this.isSending.set(true);
    this.hasSpokenForTurn = false;
    this.agentSession.sendContextualUpdate(
      'System update: An API call is in progress. Do NOT ask additional questions until the response is received.'
    );
    try {
      const reply = await this.checkinApi.callCheckinApi(goal);
      const journeyCard = this.journeyCardFormatter.buildFromResponse(reply.raw);
      this.journeyCard.set(journeyCard);
      if (journeyCard) {
        this.chat.addMessage({ role: 'agent', text: '', type: 'journey-card', data: journeyCard });
      }
      const passengerCard = this.passengerCardFormatter.buildFromResponse(reply.raw);
      if (passengerCard) {
        this.chat.addMessage({ role: 'agent', text: passengerCard.prompt, type: 'text' });
        this.chat.addMessage({ role: 'agent', text: '', type: 'passenger-list', data: passengerCard });
      }
      const boardingPassCard = this.boardingPassFormatter.buildFromResponse(reply.raw);
      if (boardingPassCard) {
        this.chat.addMessage({ role: 'agent', text: boardingPassCard.prompt, type: 'text' });
        this.chat.addMessage({ role: 'agent', text: '', type: 'boarding-pass', data: boardingPassCard });
      }
      let userMessage = reply.userMessage;
      if (!userMessage && journeyCard) {
        userMessage = `Check-in is open for ${journeyCard.origin} to ${journeyCard.destination}. ` +
          `Departure ${journeyCard.departureDate} at ${journeyCard.departureTime}.`;
      }
      if (userMessage) {
        if (this.agentSession.isOpen()) {
          this.pendingSpeakText = userMessage;
          this.trySendSpeakPrompt();
        } else {
          this.chat.addMessage({ role: 'agent', text: userMessage, type: 'text' });
        }
      } else {
        if (this.agentSession.isOpen()) {
          this.pendingSpeakText = 'Please wait while I fetch your information';
          this.trySendSpeakPrompt();
        } else {
          this.chat.addSystemMessage('Please wait while I fetch your information');
        }
      }
    } catch (error) {
      console.error('Check-in API error:', error);
      this.chat.addSystemMessage('Failed to reach the check-in service.');
    } finally {
      this.agentSession.sendContextualUpdate(
        'System update: API call completed. You may continue the conversation.'
      );
      this.isSending.set(false);
    }
  }

  private trySendSpeakPrompt(): void {
    if (!this.pendingSpeakText || !this.agentSession.isOpen()) {
      return;
    }
    if (this.agentSession.mode() === 'speaking') {
      return;
    }
    if (this.hasSpokenForTurn) {
      this.pendingSpeakText = null;
      return;
    }

    const text = this.pendingSpeakText;
    this.pendingSpeakText = null;
    this.hasSpokenForTurn = true;
    this.agentSession.sendUserMessage(`Say exactly the following sentence and nothing else: "${text}"`);
  }

  private handleModeChange(mode: Mode): void {
    if (this.lastMode === 'listening' && mode !== 'listening') {
      this.finalizeLive('user');
    }
    if (this.lastMode === 'speaking' && mode !== 'speaking') {
      this.finalizeLive('agent');
      this.flushPendingAgentText();
    }

    if (mode === 'listening' && this.liveUserText() === null) {
      this.chat.setLive('user', '');
    }

    if (mode === 'speaking' && this.liveAgentText() === null) {
      this.chat.setLive('agent', '');
    }

    this.lastMode = mode;
  }

  private finalizeLive(role: 'user' | 'agent'): void {
    const text = role === 'user' ? this.liveUserText() : this.liveAgentText();
    this.chat.clearLive(role);
    if (!text || !text.trim()) {
      return;
    }

    if (role === 'user') {
      this.lastFinalizedUserText = text;
      this.agentMessageStreak = 0;
    } else {
      this.lastFinalizedAgentText = text;
      this.agentMessageStreak += 1;
      this.checkAgentStreak();
    }

    this.chat.addMessage({ role, text, type: 'text' });
  }

  private flushPendingAgentText(): void {
    if (!this.pendingAgentFinalText) {
      return;
    }

    const text = this.pendingAgentFinalText;
    this.pendingAgentFinalText = null;
    this.lastFinalizedAgentText = text;
    this.agentMessageStreak += 1;
    this.checkAgentStreak();
    this.chat.addMessage({ role: 'agent', text, type: 'text' });
  }

  private checkAgentStreak(): void {
    if (this.agentMessageStreak < 10) {
      return;
    }

    const text = 'No response from your side, disconnecting';
    this.chat.addMessage({ role: 'agent', text, type: 'text' });
    if (this.agentSession.isOpen()) {
      this.pendingSpeakText = text;
      this.trySendSpeakPrompt();
    }
    void this.endSession();
    this.agentMessageStreak = 0;
  }
}
