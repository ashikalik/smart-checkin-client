import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonProgressBar, IonSpinner } from '@ionic/angular/standalone';
import { Scribe, RealtimeEvents, RealtimeConnection } from "@elevenlabs/client";
import { finalize } from 'rxjs';
import { QueryService } from '../../services/query.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel, IonProgressBar, IonSpinner],
})
export class HomePage {
  private token!: RealtimeConnection | null;
  private connection!: RealtimeConnection | null;
  private tokenGenerationTime: number = 0;
  private readonly tokenExpirySeconds = 15 * 60;
  public currentQuery: string = '';
  public queryRepeatCount: number = 0;
  public isStarting: boolean = false;
  public isSending: boolean = false;
  private sessionId: string = '';

  public conversation: string[] = [];

  constructor(private readonly queryService: QueryService) { }

  async start() {
    if (this.isStarting) return;
    this.isStarting = true;
    try {
      await this.startSession();
    } finally {
      this.isStarting = false;
    }
  }
  commit() {
    if (this.connection) {
      this.connection.commit();
    }
  }
  stop() {
    this.clearConversation();
    this.disconnect()
  }

  clearConversation() {
    this.conversation = [];
  }

  async startSession() {
    if (!this.sessionId) {
      this.sessionId = crypto.randomUUID();
    }
    const remainingLife = this.getTokenLife();
    if (remainingLife < 5 * 60) {
      await this.generateToken();
    }

    const token = typeof this.token === 'string' ? this.token : (this.token as { token?: string } | null)?.token;
    if (!token) return;

    this.connect(token);

  }

  async generateToken() {
    const response = await fetch("https://n8n.srv1232458.hstgr.cloud/webhook/0d1d4ee5-7ef4-4d11-83ea-aca2e271feb1");
    this.token = await response.json();
    this.tokenGenerationTime = Math.floor(Date.now() / 1000)
  }

  getTokenLife(): number {
    if (!this.tokenGenerationTime) return 0;
    const elapsed = Math.floor(Date.now() / 1000) - this.tokenGenerationTime;
    return Math.max(0, this.tokenExpirySeconds - elapsed);
  }

  public connect(token: string) {
    this.disconnect();
    this.connection = Scribe.connect({
      token,
      modelId: "scribe_v2_realtime",
      includeTimestamps: true,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.subscribeEvents();
  }

  disconnect() {
    if (this.connection) {
      this.connection.commit();
      this.connection.close();
      this.unsubscribeEvents();

    }
    this.connection = null;
  }

  setQuery(query: string) {


    if (query === this.currentQuery) {
      this.queryRepeatCount++;
    }
    if (this.queryRepeatCount > 1) {
      this.commit();
    }
    this.currentQuery = query;
  }

  commitQuery(query: string) {
    if (this.isSending) return;

    this.conversation.push(query);
    this.currentQuery = '';
    this.queryRepeatCount = 0;

    this.isSending = true;
    const fullConversation = this.conversation.join('\n');
    this.queryService.sendQuery(fullConversation, this.sessionId).pipe(
      finalize(() => {
        this.isSending = false;
      })
    ).subscribe({
      next: (response) => {
        const reply = (response as { response?: string })?.response;
        if (reply) {
          this.conversation.push(reply);
          this.isSending = false;
        }
      },
      error: (error) => {
        console.error('Query service error:', error);
      }
    });
  }

  subscribeEvents() {
    if (!this.connection)
      return;

    this.connection.on(RealtimeEvents.SESSION_STARTED, () => {
      console.log("Session started");
    });
    // Partial transcripts (interim results), use this in your UI to show the live transcript
    this.connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
      console.log("Partial:", data.text);
      this.setQuery(data.text)
    });
    // Committed transcripts
    this.connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
      console.log("Committed:", data.text);
    });
    // Committed transcripts with word-level timestamps. Only received when includeTimestamps is set to true.
    this.connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS, (data) => {
      console.log("Committed:", data.text);
      console.log("Timestamps:", data.words);
      this.commitQuery(data.text);
    });
    // Errors - will catch all errors, both server and websocket specific errors
    this.connection.on(RealtimeEvents.ERROR, (error) => {
      console.error("Error:", error);
    });
    // Connection opened
    this.connection.on(RealtimeEvents.OPEN, () => {
      console.log("Connection opened");
    });
    // Connection closed
    this.connection.on(RealtimeEvents.CLOSE, () => {
      console.log("Connection closed");
    });
  }

  unsubscribeEvents() {
    if (!this.connection)
      return;

    this.connection.off(RealtimeEvents.SESSION_STARTED, () => {
      console.log("Session started");
    });
    // Partial transcripts (interim results), use this in your UI to show the live transcript
    this.connection.off(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
      console.log("Partial:", data.text);
    });
    // Committed transcripts
    this.connection.off(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
      console.log("Committed:", data.text);
    });
    // Committed transcripts with word-level timestamps. Only received when includeTimestamps is set to true.
    this.connection.off(RealtimeEvents.COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS, (data) => {
      console.log("Committed:", data.text);
      console.log("Timestamps:", data.words);
    });
    // Errors - will catch all errors, both server and websocket specific errors
    this.connection.off(RealtimeEvents.ERROR, (error) => {
      console.error("Error:", error);
    });
    // Connection opened
    this.connection.off(RealtimeEvents.OPEN, () => {
      console.log("Connection opened");
    });
    // Connection closed
    this.connection.off(RealtimeEvents.CLOSE, () => {
      console.log("Connection closed");
    });
  }
}
