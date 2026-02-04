import { Component, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
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
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, stopCircle, volumeHigh } from 'ionicons/icons';
import { VoiceAgentService } from '../../services/voice-agent/voice-agent.service';
import type { ConversationMessage } from '../../services/voice-agent/chat.service';
import type { JourneyCardData } from '../../services/voice-agent/journey-card.types';
import type { PassengerCardData } from '../../services/voice-agent/passenger-card.types';
import type { BoardingPassCardData } from '../../services/voice-agent/boarding-pass.types';
import { JourneyCardComponent } from '../../components/journey-card/journey-card.component';
import { PassengerListCardComponent } from '../../components/passenger-list-card/passenger-list-card.component';
import { BoardingPassCarouselComponent } from '../../components/boarding-pass-carousel/boarding-pass-carousel.component';

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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonFooter,
    IonBadge,
    IonIcon,
    IonSpinner,
    JourneyCardComponent,
    PassengerListCardComponent,
    BoardingPassCarouselComponent,
  ],
})
export class VoiceAgentPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;

  inputText = '';
  private autoScrollEnabled = true;
  hasNewMessages = false;
  private lastMessageCount = 0;
  private lastHasJourneyCard = false;


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

  onContentScroll(event: CustomEvent): void {
    const detail = event.detail as { scrollTop?: number; scrollHeight?: number; clientHeight?: number } | undefined;
    if (!detail) {
      return;
    }
    const scrollTop = detail.scrollTop ?? 0;
    const scrollHeight = detail.scrollHeight ?? 0;
    const clientHeight = detail.clientHeight ?? 0;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
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
    if (!this.content) {
      return;
    }

    setTimeout(() => {
      this.content?.scrollToBottom(250);
    }, 50);
  }

  get displayItems(): DisplayItem[] {
    const items: DisplayItem[] = [];

    this.voiceAgent.messages().forEach((message) => {
      items.push({ type: 'message', payload: message });
    });

    if (this.voiceAgent.liveUserText() !== null) {
      items.push({ type: 'live-user', payload: this.voiceAgent.liveUserText() });
    }

    if (this.voiceAgent.liveAgentText() !== null) {
      items.push({ type: 'live-agent', payload: this.voiceAgent.liveAgentText() });
    }

    return items;
  }

  trackByIndex(index: number): number {
    return index;
  }

  asMessage(item: DisplayItem): ConversationMessage | null {
    return item.type === 'message' ? item.payload : null;
  }

  asJourneyData(message: ConversationMessage | null): JourneyCardData | null {
    if (!message || message.type !== 'journey-card') {
      return null;
    }
    return message.data as JourneyCardData;
  }

  asPassengerData(message: ConversationMessage | null): PassengerCardData | null {
    if (!message || message.type !== 'passenger-list') {
      return null;
    }
    return message.data as PassengerCardData;
  }

  asBoardingPassData(message: ConversationMessage | null): BoardingPassCardData | null {
    if (!message || message.type !== 'boarding-pass') {
      return null;
    }
    return message.data as BoardingPassCardData;
  }

  asLiveText(item: DisplayItem): string | null {
    if (item.type === 'live-user' || item.type === 'live-agent') {
      return item.payload ?? '';
    }
    return null;
  }
}

type DisplayItem =
  | { type: 'message'; payload: ConversationMessage }
  | { type: 'live-user'; payload: string | null }
  | { type: 'live-agent'; payload: string | null };
