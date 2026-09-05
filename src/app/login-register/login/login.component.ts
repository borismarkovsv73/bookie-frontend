import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {LoginCredentials} from "./model/login-credentials.model";
import {AuthenticationService} from "../authentication.service";
import {TokenModel} from "./model/token.model";
import {TokenService} from "../../shared/token.service";
import {HttpErrorResponse} from "@angular/common/http";
import {SharedService} from "../../shared/shared.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private tokenService : TokenService,
    private sharedService: SharedService,
    ) {}

  loginForm : FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  })

  login(): void {
      const login: LoginCredentials = {
        username: this.loginForm.value.username || "",
        password: this.loginForm.value.password || ""
      }

      this.authenticationService.login(login).subscribe({
        next : (data : TokenModel) : void => {
          this.tokenService.setToken(data);
          this.router.navigate(['']);
      },
        error : (error : HttpErrorResponse) => {
        this.sharedService.openSnackBar(error.error?.message ?? 'Error reaching the server.');
        }
      });
  }
}
