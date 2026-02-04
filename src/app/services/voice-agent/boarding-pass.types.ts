export interface BoardingPassLeg {
  travelerName: string;
  travelerTitle?: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  departureTerminal?: string;
  arrivalTime: string;
  arrivalTerminal?: string;
  cabinClass?: string;
  seat?: string;
  gate?: string;
  boardingTime?: string;
  group?: string;
  barcodeMessage?: string;
}

export interface BoardingPassCardData {
  prompt: string;
  passes: BoardingPassLeg[];
}
