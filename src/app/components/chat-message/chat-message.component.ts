import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonText } from '@ionic/angular/standalone';
import { Message } from '../../types/message.types';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, IonItem, IonText],
  template: `
    <ion-item lines="none" [class]="'message-wrapper ' + message.sender">
      <div [class]="'message-bubble ' + message.sender">
        <ion-text>
          <p class="message-text">{{ message.text }}</p>
        </ion-text>
        <ion-text color="medium">
          <small class="message-timestamp">{{ message.timestamp }}</small>
        </ion-text>
      </div>
    </ion-item>
  `,
  styles: [`
    .message-wrapper {
      --background: transparent;
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
      margin-bottom: 12px;
    }

    .message-bubble {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      word-wrap: break-word;
    }

    .message-wrapper.user {
      display: flex;
      justify-content: flex-end;
    }

    .message-wrapper.user .message-bubble {
      background: var(--etihad-gold);
      color: var(--etihad-charcoal);
    }

    .message-wrapper.ai .message-bubble {
      background: #f0f0f0;
      color: #1c1c1c;
    }

    .message-text {
      margin: 0 0 4px 0;
      font-size: 15px;
    }

    .message-timestamp {
      font-size: 11px;
      opacity: 0.7;
    }
  `]
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: Message;
}
