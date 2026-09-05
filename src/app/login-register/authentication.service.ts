import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {LoginCredentials} from "./login/model/login-credentials.model";
import {Observable} from "rxjs";
import {TokenModel} from "./login/model/token.model";
import {NewUser} from "./register/model/new-user.model";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private httpClient : HttpClient) { }

  authenticationControllerRoute : string = "http://localhost:8081/authentication/";

  login(credentials : LoginCredentials) : Observable<TokenModel>{
    return this.httpClient.post<TokenModel>(this.authenticationControllerRoute+"login",credentials);
  }

  register(userdata : NewUser) : Observable<NewUser>{
    return this.httpClient.post<NewUser>(this.authenticationControllerRoute+"register",userdata);
  }

  activate(token : string) : Observable<void>{
    return this.httpClient.get<void>(this.authenticationControllerRoute+"activate/"+token);
  }
}
