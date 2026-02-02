import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CheckinApiService {
  private readonly sessionStorageKey = 'smart-checkin-session-id';
  private readonly apiUrl = environment.checkinApiUrl ?? '/api/main/run';
  private sessionId = '';

  init(): void {
    this.sessionId = sessionStorage.getItem(this.sessionStorageKey) ?? '';
  }

  clearSession(): void {
    this.sessionId = '';
    sessionStorage.removeItem(this.sessionStorageKey);
  }

  async callCheckinApi(goal: string): Promise<{ userMessage: string; raw: unknown }> {
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
}
