import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonFooter,
  IonButton,
  IonInput,
  IonIcon
} from '@ionic/angular/standalone';
import { micOutline, sendOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonFooter,
    IonButton,
    IonInput,
    IonIcon
  ],
  template: `
    <ion-footer class="chat-footer">
      <div class="input-container">
        <div class="input-wrapper">
          <ion-input
            class="message-input"
            [placeholder]="isProcessing ? 'AI is responding...' : placeholder"
            [(ngModel)]="value"
            [disabled]="isProcessing"
            (keypress)="onKeyPress($event)"
          />

          <ion-button
            fill="clear"
            [class]="'mic-button' + (isListening ? ' listening' : '')"
            [disabled]="isProcessing"
            (mousedown)="!isProcessing && voiceStart.emit()"
            (mouseup)="voiceEnd.emit()"
            (mouseleave)="voiceEnd.emit()"
            (touchstart)="!isProcessing && voiceStart.emit()"
            (touchend)="voiceEnd.emit()"
            (touchcancel)="voiceEnd.emit()"
          >
            <ion-icon slot="icon-only" name="mic-outline" />
          </ion-button>

          <ion-button
            class="send-button"
            [disabled]="!value.trim() || isProcessing"
            (click)="send.emit()"
          >
            <ion-icon slot="icon-only" name="send-outline" />
          </ion-button>
        </div>
      </div>
    </ion-footer>
  `,
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() isListening: boolean = false;
  @Input() isProcessing: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();
  @Output() voiceStart = new EventEmitter<void>();
  @Output() voiceEnd = new EventEmitter<void>();

  constructor() {
    addIcons({ micOutline, sendOutline });
  }

  onKeyPress(event: any): void {
    if (event.key === 'Enter') {
      this.send.emit();
    }
  }
}
