export interface PassengerCardItem {
  travelerId: string;
  journeyElementId?: string;
  title?: string;
  firstName: string;
  lastName: string;
  passengerTypeCode?: string;
  flightId?: string;
  orderId?: string;
}

export interface PassengerCardData {
  prompt: string;
  passengers: PassengerCardItem[];
}
