import { Injectable } from '@angular/core';
import { JourneyCardData } from './journey-card.types';

interface JourneyEligibility {
  eligiblityName?: string;
  eligibilityName?: string;
  isEligible?: boolean;
}

interface JourneyDataPayload {
  eligibility?: JourneyEligibility | null;
  origin?: string | null;
  destination?: string | null;
  departureDate?: string | null;
}

interface JourneyApiResponse {
  stage?: string;
  status?: string;
  data?: JourneyDataPayload | null;
}

@Injectable({ providedIn: 'root' })
export class JourneyCardFormatterService {
  buildFromResponse(response: unknown): JourneyCardData | null {
    const normalized = this.normalizeResponse(response);
    const payload = normalized as JourneyApiResponse | null;
    if (!payload) {
      return null;
    }

    if (payload.stage && payload.stage !== 'JOURNEY_IDENTIFICATION') {
      return null;
    }

    if (payload.status && payload.status !== 'SUCCESS') {
      return null;
    }

    const data = payload.data;
    if (!data || !data.eligibility) {
      return null;
    }

    const eligibilityName = data.eligibility.eligiblityName ?? data.eligibility.eligibilityName;
    if (eligibilityName !== 'isCheckInOpened' || data.eligibility.isEligible !== true) {
      return null;
    }

    const origin = data.origin ?? '';
    const destination = data.destination ?? '';
    const departureDateTime = data.departureDate ?? '';
    if (!origin || !destination || !departureDateTime) {
      return null;
    }

    const date = new Date(departureDateTime);
    const departureDate = this.formatDate(date);
    const departureTime = this.formatTime(date);

    return {
      origin,
      destination,
      departureDate,
      departureTime,
      departureDateTime,
    };
  }

  private normalizeResponse(response: unknown): unknown {
    const parsed = this.tryParse(response);
    if (!parsed || typeof parsed !== 'object') {
      return parsed;
    }

    const candidate = this.findCandidate(parsed as Record<string, unknown>);
    return candidate ?? parsed;
  }

  private tryParse(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private findCandidate(value: Record<string, unknown>): Record<string, unknown> | null {
    if (value['stage'] || value['status'] || value['data']) {
      return value;
    }

    if (value['response']) {
      const parsed = this.tryParse(value['response']);
      if (parsed && typeof parsed === 'object') {
        const found = this.findCandidate(parsed as Record<string, unknown>);
        if (found) {
          return found;
        }
      }
    }

    if (value['data']) {
      const parsed = this.tryParse(value['data']);
      if (parsed && typeof parsed === 'object') {
        const found = this.findCandidate(parsed as Record<string, unknown>);
        if (found) {
          return found;
        }
      }
    }

    if (value['result']) {
      const parsed = this.tryParse(value['result']);
      if (parsed && typeof parsed === 'object') {
        const found = this.findCandidate(parsed as Record<string, unknown>);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  private formatDate(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatTime(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
