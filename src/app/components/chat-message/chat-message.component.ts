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
      --inner-padding-start: 0;
      margin-bottom: 12px;
      display: flex;
      width: 100%;
    }

    .message-wrapper.user {
      justify-content: flex-end;
      padding-right: 8px;
    }

    .message-wrapper.ai {
      justify-content: flex-start;
      padding-left: 8px;
    }

    .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: inline-block;
    }

    .message-wrapper.user .message-bubble {
      background: var(--etihad-gold);
      color: white;
      border-bottom-right-radius: 4px;
      margin-left: auto;
      text-align: right;
    }

    .message-wrapper.ai .message-bubble {
      background: var(--etihad-sand);
      color: var(--etihad-charcoal);
      border-bottom-left-radius: 4px;
      margin-right: auto;
      text-align: left;
    }

    .message-text {
      margin: 0 0 4px 0;
      font-size: 15px;
      line-height: 1.4;
    }

    .message-timestamp {
      font-size: 11px;
      opacity: 0.7;
      display: block;
    }

    .message-wrapper.user .message-timestamp {
      color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: Message;
}
