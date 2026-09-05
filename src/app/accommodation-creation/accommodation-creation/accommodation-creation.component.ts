import {Component} from '@angular/core';
import {AccommodationService} from "../../layout/accommodation.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SharedService} from "../../shared/shared.service";
import {HttpErrorResponse} from "@angular/common/http";
import {AccommodationCreateDTO} from "./model/accommodation-create.model";
import {AccommodationDTO} from "../../layout/accommodation-card/model/accommodation.model";

@Component({
  selector: 'app-accommodation-creation',
  templateUrl: './accommodation-creation.component.html',
  styleUrl: './accommodation-creation.component.scss'
})
export class AccommodationCreationComponent {
  amenities: string[] = ['WiFi', 'Parking', 'Kitchen', 'AC'];
  accommodationTypes: string[] = ['Apartment', 'Studio', 'Room'];

  newStartDate: Date;
  newEndDate: Date;
  newPrice: string;

  accommodation = {
    name: '',
    description: '',
    minimumGuests: 1,
    maximumGuests: 2,
    location: {
      latitude: 0,
      longitude: 0
    },
    amenities: [] as string[],
    type: '',
    reservationAutoAccepted: false,
    pricedPerGuest: false,
    reservationCancellationDeadline: 1,
    availabilityPeriods: [] as {
      id: number;
      price: number;
      period: {
        startDate: string;
        endDate: string;
      };
      deleted: boolean;
    }[]
  };

  constructor(private accommodationService: AccommodationService, private router: Router,
              private _snackBar: MatSnackBar, private sharedService: SharedService) {
  }

  parseDateString(dateString: string): Date | null {
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JavaScript
      const day = parseInt(dateParts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return null;
  }

  updateAmenities(amenity: string): void {
    if (this.accommodation.amenities.includes(amenity)) {
      this.accommodation.amenities = this.accommodation.amenities.filter(a => a !== amenity);
    } else {
      this.accommodation.amenities.push(amenity);
    }
  }

  deletePeriod(index: number): void {
    this.accommodation.availabilityPeriods.splice(index, 1);
  }

  addPeriod(): void {
    if (isNaN(Number(this.newPrice)) || this.newPrice == undefined || this.newPrice === '') {
      this._snackBar.open('The price you added is not a number', 'Close');
      return;
    }
    if (this.newStartDate == undefined || this.newEndDate == undefined) {
      this._snackBar.open('Please select a valid date range', 'Close');
      return;
    }
    let flag = false;
    this.accommodation.availabilityPeriods.forEach((availabilityPeriod) => {
      const startDate = this.parseDateString(availabilityPeriod.period.startDate);
      const endDate = this.parseDateString(availabilityPeriod.period.endDate);
      if (
        (this.newStartDate >= startDate! && this.newStartDate < endDate!) ||
        (this.newEndDate > startDate! && this.newEndDate <= endDate!)
      ) {
        this._snackBar.open('The entered period overlaps with another one', 'Close');
        flag = true;
        return;
      }
    });
    if (flag) {
      return;
    }
    this.accommodation.availabilityPeriods.push({
      id: this.accommodation.availabilityPeriods.length + 1,
      price: parseInt(this.newPrice),
      period: {
        startDate: this.newStartDate.toLocaleDateString('en-CA'),
        endDate: this.newEndDate.toLocaleDateString('en-CA')
      },
      deleted: false
    });
  }

  CreateAccommodation(): void {
    if (!this.accommodation.name || !this.accommodation.description || !this.accommodation.type) {
      this._snackBar.open('Please fill in all required fields', 'Close', {
        duration: 2000,
      });
      return;
    }

    const accommodationCreateDTO: AccommodationCreateDTO = {
      name: this.accommodation.name,
      description: this.accommodation.description,
      minimumGuests: this.accommodation.minimumGuests,
      maximumGuests: this.accommodation.maximumGuests,
      location: this.accommodation.location,
      amenities: this.accommodation.amenities,
      type: this.accommodation.type,
      reservationAutoAccepted: this.accommodation.reservationAutoAccepted,
      pricedPerGuest: this.accommodation.pricedPerGuest,
      reservationCancellationDeadline: this.accommodation.reservationCancellationDeadline,
      images: [],
      availabilityPeriods: []
    };

    this.accommodation.availabilityPeriods.forEach((availabilityPeriod) => {
      const formatStartDate: Date | null = this.parseDateString(availabilityPeriod.period.startDate);
      const formatEndDate: Date | null = this.parseDateString(availabilityPeriod.period.endDate);
      if (formatStartDate != null && formatEndDate != null) {
        accommodationCreateDTO.availabilityPeriods.push({
          price: availabilityPeriod.price,
          period: {
            startTimestamp: formatStartDate.getTime(),
            endTimestamp: formatEndDate.getTime()
          }
        });
      }
    });

    this.accommodationService.createAccommodation(accommodationCreateDTO).subscribe({
      next: (created: AccommodationDTO): void => {
        this._snackBar.open('Accommodation created successfully', 'Close', {
          duration: 2000,
        });
        this.router.navigate(['/updating', created.id]);
      },
      error: (error: HttpErrorResponse): void => {
        if (error && error.error && error.error.message)
          this.sharedService.openSnackBar(error.error.message);
        else
          this.sharedService.openSnackBar('Something went wrong while creating the accommodation.');
      }
    });
  }
}
