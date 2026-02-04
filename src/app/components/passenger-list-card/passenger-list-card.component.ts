import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonList, IonItem, IonAvatar } from '@ionic/angular/standalone';
import { PassengerCardData } from '../../services/voice-agent/passenger-card.types';

@Component({
  selector: 'app-passenger-list-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonList, IonItem, IonAvatar],
  template: `
    <ion-card class="passenger-card">
      <ion-card-content>
        <ion-list class="passenger-list">
          <ion-item lines="none" class="passenger-item" *ngFor="let passenger of data.passengers">
            <ion-avatar slot="start" class="passenger-avatar">
              <span class="avatar-text">
                {{ (passenger.firstName || '').charAt(0) }}{{ (passenger.lastName || '').charAt(0) }}
              </span>
            </ion-avatar>
            <div class="passenger-name">
              <span class="passenger-primary">
                {{ passenger.title }} {{ passenger.firstName }} {{ passenger.lastName }}
              </span>
            </div>
          </ion-item>
        </ion-list>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
    .passenger-card {
      margin: 8px 12px 16px;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      background: #ffffff;
    }

    .passenger-list {
      --background: transparent;
      background: transparent;
      padding: 0;
      margin: 0;
      max-height: 180px;
      overflow-y: auto;
    }

    .passenger-item {
      --background: transparent;
      --inner-border-width: 0;
      --border-width: 0;
      padding: 0;
    }

    .passenger-item::part(native) {
      padding: 8px 0;
      align-items: center;
    }

    .passenger-avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #f3efe5;
      border: 1px solid #e2dfd6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-text {
      font-size: 12px;
      font-weight: 700;
      color: var(--etihad-charcoal);
      text-transform: uppercase;
    }

    .passenger-name {
      display: flex;
      width: 100%;
      font-size: 14px;
      color: var(--etihad-charcoal);
    }

    .passenger-primary {
      font-weight: 600;
    }
  `,
  ],
})
export class PassengerListCardComponent {
  @Input({ required: true }) data!: PassengerCardData;
}
