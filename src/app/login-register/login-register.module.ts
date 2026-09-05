import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { LoginComponent } from './login/login.component';
import { MaterialModule } from "../infrastructure/material/material.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RegisterComponent } from './register/register.component';
import { ActivateComponent } from './activate/activate.component';
import {RouterModule} from "@angular/router";
import {SharedModule} from "../shared/shared.module";

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    ActivateComponent
  ],
    imports: [
        CommonModule,
        MaterialModule,
        FormsModule,
        NgOptimizedImage,
        RouterModule,
        ReactiveFormsModule,
        SharedModule,
    ]
})

export class LoginRegisterModule { }
