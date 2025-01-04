import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://44.212.45.205/'; // Replace with your actual API endpoint
  private readonly http = inject(HttpClient);

  registerUser(payload: any): Observable<any> {
    return this.http.post(this.apiUrl + 'v1/auth/create-user', payload);
  };

  loginUser(payload: any): Observable<any> {
    return this.http.post(this.apiUrl + 'v1/auth/login', payload);
  }
}