import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  apiUrl = "http://localhost:3000"
  username;
  password;
  

  constructor(private http: HttpClient) { }

  checkuser(user:User){
    return this.http.post<User>(`/api/user`,user).toPromise()}


  uploadImage(FormData){
     
      return this.http.post(`/api/image`, FormData).toPromise();
    }

    validuser(username,password){
      this.username = username
      this.password = password
    }

    gotUserData(){
      const opt:User = {
        username:this.username,
        password:this.password
      }
      return opt
    }

  }
  
  

  

  

