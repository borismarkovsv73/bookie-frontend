export interface AccommodationCreateDTO {
  name: string;
  description: string;
  minimumGuests: number;
  maximumGuests: number;
  location: {
    latitude: number;
    longitude: number;
  };
  amenities: string[];
  availabilityPeriods: {
    price: number;
    period: {
      startDate: string;
      endDate: string;
    };
  }[];
  images: any[];
  reservationCancellationDeadline: number;
  type: string;
  reservationAutoAccepted: boolean;
  pricedPerGuest: boolean;
}
