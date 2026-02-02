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
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        return response;
      }
    }

    if (!response || typeof response !== 'object') {
      return response;
    }

    const payload = response as { stage?: string; status?: string; data?: unknown };
    if (payload.stage || payload.status) {
      return payload;
    }

    if ((response as { response?: unknown }).response) {
      const nestedResponse = (response as { response?: unknown }).response;
      if (typeof nestedResponse === 'string') {
        try {
          return JSON.parse(nestedResponse);
        } catch {
          return nestedResponse;
        }
      }
      if (nestedResponse && typeof nestedResponse === 'object') {
        return nestedResponse;
      }
    }

    if (typeof payload.data === 'string') {
      try {
        return JSON.parse(payload.data);
      } catch {
        return payload;
      }
    }

    if (payload.data && typeof payload.data === 'object') {
      const nested = payload.data as { stage?: string; status?: string };
      if (nested.stage || nested.status) {
        return nested;
      }
    }

    return payload;
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
