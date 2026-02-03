import { Component, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonFooter,
  IonBadge,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { addIcons } from 'ionicons';
import { playCircle, stopCircle, volumeHigh } from 'ionicons/icons';
import { VoiceAgentService } from '../../services/voice-agent/voice-agent.service';
import type { JourneyCardData } from '../../services/voice-agent/journey-card.types';
import type { ConversationMessage } from '../../services/voice-agent/chat.service';
import { JourneyCardComponent } from '../../components/journey-card/journey-card.component';

@Component({
  selector: 'app-voice-agent',
  templateUrl: './voice-agent.page.html',
  styleUrls: ['./voice-agent.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonFooter,
    IonBadge,
    IonIcon,
    IonSpinner,
    ScrollingModule,
    JourneyCardComponent,
  ],
})
export class VoiceAgentPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild(CdkVirtualScrollViewport) private viewport?: CdkVirtualScrollViewport;

  inputText = '';
  private autoScrollEnabled = true;
  hasNewMessages = false;
  private lastMessageCount = 0;
  private lastHasJourneyCard = false;
  readonly itemSize = 88;

  private readonly emptyItems: DisplayItem[] = [];

  constructor(public readonly voiceAgent: VoiceAgentService) {
    addIcons({ playCircle, stopCircle, volumeHigh });

    effect(() => {
      const messages = this.voiceAgent.messages();
      const hasJourneyCard = Boolean(this.voiceAgent.journeyCard());
      const messageCount = this.displayItems.length;

      if (messageCount !== this.lastMessageCount || hasJourneyCard !== this.lastHasJourneyCard) {
        this.lastMessageCount = messageCount;
        this.lastHasJourneyCard = hasJourneyCard;

        if (this.autoScrollEnabled) {
          this.scrollToBottom();
          this.hasNewMessages = false;
        } else {
          this.hasNewMessages = true;
        }
      }
    });
  }

  ngOnInit(): void {
    this.voiceAgent.init();
  }

  ngOnDestroy(): void {
    void this.voiceAgent.endSession();
  }

  get statusColor(): string {
    switch (this.voiceAgent.status()) {
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

  sendMessage(): void {
    const trimmed = this.inputText.trim();
    if (!trimmed) {
      return;
    }

    this.voiceAgent.sendUserText(trimmed);
    this.inputText = '';
  }

  toggleSession(): void {
    this.voiceAgent.toggleSession();
  }

  onViewportScroll(): void {
    if (!this.viewport) {
      return;
    }
    const distanceFromBottom = this.viewport.measureScrollOffset('bottom');
    this.autoScrollEnabled = distanceFromBottom < 48;
    if (this.autoScrollEnabled) {
      this.hasNewMessages = false;
    }
  }

  jumpToLatest(): void {
    this.autoScrollEnabled = true;
    this.hasNewMessages = false;
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (!this.viewport) {
      return;
    }

    setTimeout(() => {
      this.viewport?.scrollToIndex(Math.max(0, this.displayItems.length - 1), 'smooth');
    }, 50);
  }

  get displayItems(): DisplayItem[] {
    const items: DisplayItem[] = [];

    if (this.voiceAgent.journeyCard()) {
      items.push({ type: 'journey', payload: this.voiceAgent.journeyCard() as JourneyCardData });
    }

    this.voiceAgent.messages().forEach((message) => {
      items.push({ type: 'message', payload: message });
    });

    if (this.voiceAgent.liveUserText() !== null) {
      items.push({ type: 'live-user', payload: this.voiceAgent.liveUserText() });
    }

    if (this.voiceAgent.liveAgentText() !== null) {
      items.push({ type: 'live-agent', payload: this.voiceAgent.liveAgentText() });
    }

    return items.length ? items : this.emptyItems;
  }

  trackByIndex(index: number): number {
    return index;
  }

  asJourney(item: DisplayItem): JourneyCardData | null {
    return item.type === 'journey' ? item.payload : null;
  }

  asMessage(item: DisplayItem): ConversationMessage | null {
    return item.type === 'message' ? item.payload : null;
  }

  asLiveText(item: DisplayItem): string | null {
    if (item.type === 'live-user' || item.type === 'live-agent') {
      return item.payload ?? '';
    }
    return null;
  }
}

type DisplayItem =
  | { type: 'journey'; payload: JourneyCardData }
  | { type: 'message'; payload: ConversationMessage }
  | { type: 'live-user'; payload: string | null }
  | { type: 'live-agent'; payload: string | null };
