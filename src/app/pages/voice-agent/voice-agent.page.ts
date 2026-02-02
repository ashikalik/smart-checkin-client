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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonFooter,
    IonBadge,
    IonIcon,
    IonSpinner,
    JourneyCardComponent,
  ],
})
export class VoiceAgentPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;

  inputText = '';

  constructor(public readonly voiceAgent: VoiceAgentService) {
    addIcons({ playCircle, stopCircle, volumeHigh });

    effect(() => {
      this.voiceAgent.messages();
      this.voiceAgent.journeyCard();
      this.scrollToBottom();
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

  private scrollToBottom(): void {
    if (!this.content) {
      return;
    }

    setTimeout(() => {
      this.content?.scrollToBottom(250);
    }, 50);
  }
}
