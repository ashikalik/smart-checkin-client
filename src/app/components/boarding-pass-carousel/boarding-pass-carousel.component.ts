import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText } from '@ionic/angular/standalone';
import { BoardingPassCardData } from '../../services/voice-agent/boarding-pass.types';

@Component({
  selector: 'app-boarding-pass-carousel',
  standalone: true,
  imports: [CommonModule, IonText],
  template: `
    <div class="bp-list">
      <div class="bp-card" *ngFor="let pass of data.passes">
        <div class="bp-row bp-airline-row">
          <ion-text class="bp-airline">ETIHAD AIRWAYS</ion-text>
        </div>

        <div class="bp-row bp-route-row">
          <div class="bp-code">{{ pass.origin }}</div>
          <div class="bp-flight-icon">✈</div>
          <div class="bp-code">{{ pass.destination }}</div>
        </div>

        <div class="bp-row bp-meta-row">
          <div class="bp-meta-col">
            <span class="bp-label">Gate</span>
            <span class="bp-value">{{ pass.gate || '--' }}</span>
          </div>
          <div class="bp-meta-col">
            <span class="bp-label">Seat</span>
            <span class="bp-value">{{ pass.seat || '--' }}</span>
          </div>
          <div class="bp-meta-col">
            <span class="bp-label">Boarding</span>
            <span class="bp-value">{{ formatTime(pass.boardingTime) }}</span>
          </div>
        </div>

        <div class="bp-row bp-passenger-row">
          <span class="bp-label">Passenger</span>
          <span class="bp-passenger">{{ pass.travelerTitle }} {{ pass.travelerName }}</span>
        </div>

        <div class="bp-row bp-departure-row">
          <span class="bp-label">Departure</span>
          <span class="bp-departure">{{ formatDateTime(pass.departureTime) }}</span>
        </div>

        <div class="bp-row bp-qr-row">
          <div class="bp-qr-box">
            <img class="bp-aztec" src="assets/aztec-placeholder.svg" alt="Aztec code placeholder" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .bp-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0 16px;
    }

    .bp-card {
      width: 100%;
      background: #ffffff;
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
      border: 1px solid #e5dfd3;
      display: grid;
      gap: 12px;
    }

    .bp-row {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bp-airline-row {
      justify-content: flex-start;
    }

    .bp-airline {
      font-size: 12px;
      font-weight: 700;
      color: var(--etihad-charcoal);
      letter-spacing: 1px;
    }

    .bp-route-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
    }

    .bp-code {
      font-size: 20px;
      font-weight: 700;
      color: var(--etihad-charcoal);
      text-align: center;
    }

    .bp-flight-icon {
      font-size: 16px;
      color: #6b5a3a;
    }

    .bp-meta-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .bp-meta-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: center;
    }

    .bp-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.6px;
    }

    .bp-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--etihad-charcoal);
    }

    .bp-passenger-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .bp-passenger {
      font-size: 14px;
      font-weight: 700;
      color: var(--etihad-charcoal);
    }

    .bp-departure-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .bp-departure {
      font-size: 12px;
      font-weight: 600;
      color: #6b5a3a;
    }

    .bp-qr-row {
      justify-content: center;
    }

    .bp-qr-box {
      width: 60%;
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      border: 2px solid #c9b89b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #6b5a3a;
      background: #fff;
      position: relative;
      overflow: hidden;
      padding: 10%;
    }

    .bp-aztec {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  `,
  ],
})
export class BoardingPassCarouselComponent {
  @Input({ required: true }) data!: BoardingPassCardData;

  formatTime(value?: string): string {
    if (!value) {
      return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
