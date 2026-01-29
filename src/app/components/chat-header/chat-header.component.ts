import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/" (click)="onBackClick()" />
        </ion-buttons>
        <ion-title>AI Check-In Support</ion-title>
      </ion-toolbar>
    </ion-header>
  `
})
export class ChatHeaderComponent {
  @Output() backClick = new EventEmitter<void>();

  onBackClick() {
    this.backClick.emit();
  }
}
