import {Component, OnInit} from '@angular/core';
import {AccommodationDTO} from "../../layout/accommodation-card/model/accommodation.model";
import {AccommodationService} from "../../layout/accommodation.service";
import {ActivatedRoute} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AccommodationBasicInfoDTO} from "./model/accommodation.basic-info.model";
import {AccommodationAutoAccept} from "./model/accommodation-auto-accept.model";
import {SharedService} from "../../shared/shared.service";
import {HttpErrorResponse} from "@angular/common/http";
import {ImageService} from "../../shared/image.service";

@Component({
  selector: 'app-accommodation-updating',
  templateUrl: './accommodation-updating.component.html',
  styleUrl: './accommodation-updating.component.scss',
  host: {ngSkipHydration: 'true'},

})
export class AccommodationUpdatingComponent implements OnInit {
  amenities: string[] = ['WiFi', 'Parking', 'Kitchen', 'AC'];
  accommodationTypes: string[] = ['Apartment', 'Studio', 'Room'];
  accommodation:AccommodationDTO;
  newStartDate:Date;
  newEndDate:Date;
  newPrice:string;

  constructor(private accommodationService:AccommodationService,private route: ActivatedRoute,private _snackBar: MatSnackBar,
              private sharedService: SharedService, private imageService: ImageService) { }

  images: {
    id:number,
    path:any
  }[]=[];
  imageFiles:any[]=[];

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      this.accommodationService.getAccommodationDetails(id.toString()).subscribe({
        next: (accommodation: AccommodationDTO): AccommodationDTO => this.accommodation = accommodation,
        error: (_) => {
        }
      });
    });
    this.accommodation.images.forEach((image)=>{
      this.imageService.loadImage(image.id).subscribe(
        (imageSrc: string | null) => {
          if (imageSrc) {
            this.images.push({id:image.id,path:imageSrc});
          } else {
            console.error('Error loading image');
          }
        }
      );
      this.accommodationService.loadImage(image.id).subscribe(
        (imageBlob: Blob) => {
            this.imageFiles.push(new File([imageBlob],"example.jpg",{type:imageBlob.type}));
        },
        (error) => {
          console.error('Error loading image:', error);
        }
      );
    })
  }
  trackByImage(index: number, image: any): any {
    return image;
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
  SaveChanges():void{
    const accommodationAutoAccept: AccommodationAutoAccept = {
      reservationAutoAccepted: this.accommodation.reservationAutoAccepted,
    }

    this.accommodationService.putAccommodationIsReservationAutoAccepted(this.accommodation.id, accommodationAutoAccept)
      .subscribe({
        next: (): void => {
          let accommodationBasicInfo:AccommodationBasicInfoDTO={
            id:this.accommodation.id,
            name:this.accommodation.name,
            description:this.accommodation.description,
            minimumGuests:this.accommodation.minimumGuests,
            maximumGuests:this.accommodation.maximumGuests,
            location:this.accommodation.location,
            amenities:this.accommodation.amenities,
            images:this.accommodation.images,
            type:this.accommodation.type,
            pricedPerGuest:this.accommodation.pricedPerGuest,
            reservationCancellationDeadline:this.accommodation.reservationCancellationDeadline,
            availabilityPeriods:[]
          }
          this.accommodation.availabilityPeriods.forEach((availabilityPeriod)=>{
            const formatStartDate:Date|null=this.parseDateString(availabilityPeriod.period.startDate);
            const formatEndDate:Date|null=this.parseDateString(availabilityPeriod.period.endDate);
            console.log(formatStartDate?.getTime())
            if(formatStartDate!=null && formatEndDate!=null){
              accommodationBasicInfo.availabilityPeriods.push({
                id:availabilityPeriod.id,
                price:availabilityPeriod.price,
                period:{
                  startTimestamp:formatStartDate.getTime(),
                  endTimestamp:formatEndDate.getTime()
                },
                deleted:availabilityPeriod.deleted
              });
            }
          });
          this.accommodationService.updateAccommodationBasicInfo(accommodationBasicInfo)
            .subscribe(updatedInfo => {
                this._snackBar.open('Successfully changed information', 'Close',{
                  duration: 2000,
                });
              },

              (error: HttpErrorResponse) =>{
                if (error && error.error && error.error.message)
                  this.sharedService.openSnackBar(error.error.message);
                else
                  this._snackBar.open('Something went wrong', 'Close',{
                    duration: 2000,
                  });
              });
        },
        error: (error: HttpErrorResponse): void => {
          if (error)
            this.sharedService.openSnackBar(error.error.message);
          else
            this.sharedService.openSnackBar('Error reaching the server.');
        },
      })
  }
  formatDate(unixTimestamp: number): Date {
    return new Date(unixTimestamp * 1000);
  }

  deletePeriod(index: number): void {
    this.accommodation.availabilityPeriods.splice(index, 1);
  }
  addPeriod():void{
    if(isNaN(Number(this.newPrice))){
      this._snackBar.open('The price you added is not a number', 'Close');
      return;
    }
    if(this.newStartDate==undefined || this.newEndDate==undefined){
      this._snackBar.open('Please select a valid date range', 'Close');
      return;
    }
    let flag=false;
    this.accommodation.availabilityPeriods.forEach((availabilityPeriod)=>{
      const startDate=this.parseDateString(availabilityPeriod.period.startDate);
      const endDate=this.parseDateString(availabilityPeriod.period.endDate);
      if (
        (this.newStartDate >= startDate! && this.newStartDate < endDate!) ||
        (this.newEndDate > startDate! &&
          this.newEndDate <= endDate!)
      ) {
        console.log(startDate);
        this._snackBar.open('The entered period overlaps with another one', 'Close');
        flag = true;
        return;
      }
    })
    if(flag){
      return;
    }
    this.accommodation.availabilityPeriods.push({
      id:this.accommodation.availabilityPeriods.length+1,
      price:parseInt(this.newPrice),
      period:{
        startDate:this.newStartDate.toLocaleDateString('en-CA'),
        endDate:this.newEndDate.toLocaleDateString('en-CA')
      },
      deleted:false
    })
  }
  onFileSelected(event: any): void {
    const selectedFile = event.target.files[0];
    console.log(event.target.files[0]);
    this.imageService.uploadImageToAccommodation(selectedFile,this.accommodation.id).subscribe((response)=>{
        console.log("Radi")
      },
      (error)=>{
        console.log("Ne radi")
      }
    );
    window.location.reload();
  }
  deleteImage(index:number):void {
    console.log(index);
    this.imageService.deleteImage(index).subscribe((response)=>{
      console.log(response);
    },
      (error)=> {
      console.log("Not found");
      });
    window.location.reload();
  }
}
