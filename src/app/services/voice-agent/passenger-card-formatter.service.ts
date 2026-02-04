import { Injectable } from '@angular/core';
import { PassengerCardData } from './passenger-card.types';

interface PassengerDataPayload {
  passengersToCheckIn?: Array<{
    journeyElementId?: string;
    travelerId?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    passengerTypeCode?: string;
    flightId?: string;
    orderId?: string;
  }> | null;
  prompt?: string | null;
}

interface PassengerApiResponse {
  stage?: string;
  status?: string;
  data?: PassengerDataPayload | null;
  userMessage?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PassengerCardFormatterService {
  buildFromResponse(response: unknown): PassengerCardData | null {
    const payload = this.normalizeResponse(response) as PassengerApiResponse | null;
    if (!payload) {
      return null;
    }

    if (payload.stage && payload.stage !== 'VALIDATE_PROCESS_CHECKIN') {
      return null;
    }

    if (payload.status && payload.status !== 'USER_INPUT_REQUIRED') {
      return null;
    }

    const data = payload.data;
    const passengers = data?.passengersToCheckIn ?? [];
    if (!passengers.length) {
      return null;
    }

    const normalizedPassengers = passengers
      .filter((passenger) => passenger.firstName && passenger.lastName && passenger.travelerId)
      .map((passenger) => ({
        travelerId: passenger.travelerId ?? '',
        journeyElementId: passenger.journeyElementId,
        title: passenger.title,
        firstName: passenger.firstName ?? '',
        lastName: passenger.lastName ?? '',
        passengerTypeCode: passenger.passengerTypeCode,
        flightId: passenger.flightId,
        orderId: passenger.orderId,
      }));

    if (!normalizedPassengers.length) {
      return null;
    }

    const prompt = data?.prompt ?? payload.userMessage ?? 'Select a passenger to check in.';

    return {
      prompt,
      passengers: normalizedPassengers,
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

    const value = response as { data?: unknown; response?: unknown };
    if ((value as { stage?: string }).stage || (value as { status?: string }).status) {
      return value;
    }

    if (value.response) {
      return this.normalizeResponse(value.response);
    }

    if (value.data) {
      return this.normalizeResponse(value.data);
    }

    return value;
  }
}
