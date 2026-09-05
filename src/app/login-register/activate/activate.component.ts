import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../authentication.service';

type ActivationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrl: './activate.component.scss'
})
export class ActivateComponent implements OnInit {
  state: ActivationState = 'loading';
  errorMessage: string = '';
  isExpired: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';

    this.authenticationService.activate(token).subscribe({
      next: (): void => {
        this.state = 'success';
      },
      error: (error: HttpErrorResponse): void => {
        this.state = 'error';
        this.isExpired = error.status === 410;
        this.errorMessage = error.error?.message ?? 'Something went wrong. Please try again later.';
      }
    });
  }
}
