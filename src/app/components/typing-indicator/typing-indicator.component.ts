import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule, IonItem],
  template: `
    <ion-item lines="none" class="typing-indicator-container">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </ion-item>
  `,
  styles: [`
    .typing-indicator-container {
      --background: transparent;
      --padding-start: 0;
      --padding-end: 0;
      margin-bottom: 12px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #f0f0f0;
      border-radius: 16px;
      max-width: 60px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      30% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
  `]
})
export class TypingIndicatorComponent {}
