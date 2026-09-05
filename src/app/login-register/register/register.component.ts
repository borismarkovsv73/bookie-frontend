import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {NewUser} from "./model/new-user.model";
import {AuthenticationService} from "../authentication.service";
import {HttpErrorResponse} from "@angular/common/http";
import {SharedService} from "../../shared/shared.service";

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup = new FormGroup( {
    email : new FormControl('', Validators.required),
    password : new FormControl('', Validators.required),
    confirmPassword : new FormControl('', Validators.required),
    name : new FormControl('', Validators.required),
    surname : new FormControl('', Validators.required),
    address : new FormControl('', Validators.required),
    telephone : new FormControl('', Validators.required),
    role : new FormControl('', Validators.required),
  }, { validators: passwordsMatchValidator });

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private sharedService: SharedService,
  ) {}

  onSubmit() {
    const register: NewUser = {
      username : this.registerForm.value.email || "",
      password : this.registerForm.value.password || "",
      name : this.registerForm.value.name || "",
      surname : this.registerForm.value.surname || "",
      addressOfResidence : this.registerForm.value.address || "",
      telephone : this.registerForm.value.telephone || "",
      role : this.registerForm.value.role || "",
    }

    this.authenticationService.register(register).subscribe({
      next : (data : NewUser) : void => {
        this.router.navigate(['/login']);
      },
        error : (error : HttpErrorResponse) => {
        this.sharedService.openSnackBar(error.error?.message ?? 'Error reaching the server.');
        }
    });
  }
}
