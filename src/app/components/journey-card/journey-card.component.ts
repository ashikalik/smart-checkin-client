import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonIcon, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { airplaneOutline } from 'ionicons/icons';
import { JourneyCardData } from '../../services/voice-agent/journey-card.types';

@Component({
  selector: 'app-journey-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon, IonText],
  template: `
    <ion-card class="journey-card">
      <ion-card-content>
        <div class="journey-row">
          <div class="journey-point">
            <ion-text class="journey-code">{{ data.origin }}</ion-text>
            <ion-text color="medium" class="journey-label">Origin</ion-text>
          </div>

          <div class="journey-line">
            <span class="journey-dots"></span>
            <ion-icon name="airplane-outline" class="journey-icon"></ion-icon>
            <span class="journey-dots"></span>
          </div>

          <div class="journey-point">
            <ion-text class="journey-code">{{ data.destination }}</ion-text>
            <ion-text color="medium" class="journey-label">Destination</ion-text>
          </div>
        </div>

        <div class="journey-meta">
          <ion-text color="medium" class="journey-label">Departure</ion-text>
          <ion-text class="journey-time">{{ data.departureDate }} · {{ data.departureTime }}</ion-text>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
    .journey-card {
      margin: 8px 12px 16px;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      background: #ffffff;
    }

    .journey-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .journey-point {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 72px;
    }

    .journey-code {
      font-size: 20px;
      font-weight: 700;
      color: var(--etihad-charcoal);
    }

    .journey-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .journey-line {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .journey-dots {
      flex: 1;
      height: 1px;
      border-bottom: 2px dotted #d1c7b6;
    }

    .journey-icon {
      font-size: 20px;
      color: var(--etihad-gold);
    }

    .journey-meta {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .journey-time {
      font-size: 14px;
      font-weight: 600;
      color: var(--etihad-charcoal);
    }
  `,
  ],
})
export class JourneyCardComponent {
  @Input({ required: true }) data!: JourneyCardData;

  constructor() {
    addIcons({ airplaneOutline });
  }
}
