import { Injectable } from '@angular/core';
import { BoardingPassCardData } from './boarding-pass.types';

interface BoardingPassApiResponse {
  stage?: string;
  status?: string;
  data?: {
    boardingPasses?: Array<{
      travelerName?: string;
      legs?: Array<{
        travelerInfo?: { travelerName?: string; travelerTitle?: string };
        flightInfo?: {
          flightNumber?: string;
          origin?: string;
          destination?: string;
          departureTime?: string;
          departureTerminal?: string;
          arrivalTime?: string;
          arrivalTerminal?: string;
          cabinClass?: string;
          seat?: string;
          group?: string;
        };
        boardingDetails?: { gate?: string; boardingTime?: string };
        barcodeMessage?: string;
      }>;
    }>;
  } | null;
  userMessage?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BoardingPassFormatterService {
  buildFromResponse(response: unknown): BoardingPassCardData | null {
    const payload = this.normalizeResponse(response) as BoardingPassApiResponse | null;
    if (!payload) {
      return null;
    }

    if (payload.stage && payload.stage !== 'BOARDING_PASS') {
      return null;
    }

    if (payload.data?.boardingPasses && payload.data.boardingPasses.length === 0) {
      return null;
    }

    const passes: BoardingPassCardData['passes'] = [];
    const sourcePasses = payload.data?.boardingPasses ?? [];

    sourcePasses.forEach((pass) => {
      pass.legs?.forEach((leg) => {
        const travelerName =
          leg.travelerInfo?.travelerName ??
          pass.travelerName ??
          'Passenger';

        passes.push({
          travelerName,
          travelerTitle: leg.travelerInfo?.travelerTitle,
          flightNumber: leg.flightInfo?.flightNumber ?? '',
          origin: leg.flightInfo?.origin ?? '',
          destination: leg.flightInfo?.destination ?? '',
          departureTime: leg.flightInfo?.departureTime ?? '',
          departureTerminal: leg.flightInfo?.departureTerminal,
          arrivalTime: leg.flightInfo?.arrivalTime ?? '',
          arrivalTerminal: leg.flightInfo?.arrivalTerminal,
          cabinClass: leg.flightInfo?.cabinClass,
          seat: leg.flightInfo?.seat,
          group: leg.flightInfo?.group,
          gate: leg.boardingDetails?.gate,
          boardingTime: leg.boardingDetails?.boardingTime,
          barcodeMessage: leg.barcodeMessage,
        });
      });
    });

    if (!passes.length) {
      return null;
    }

    const prompt = payload.userMessage ?? 'Your boarding pass is ready.';

    return {
      prompt,
      passes,
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
    if ((value as { stage?: string }).stage) {
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
