import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList } from '@ionic/angular/standalone';
import { Message } from '../../types/message.types';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    ChatMessageComponent,
    TypingIndicatorComponent
  ],
  template: `
    <ion-list class="message-list">
      @for (message of messages; track message.id) {
        <app-chat-message [message]="message" />
      }
      @if (isTyping) {
        <app-typing-indicator />
      }
    </ion-list>
  `,
  styles: [`
    .message-list {
      padding: 16px;
      background: transparent;
    }
  `]
})
export class MessageListComponent {
  @Input({ required: true }) messages!: Message[];
  @Input() isTyping: boolean = false;
}
