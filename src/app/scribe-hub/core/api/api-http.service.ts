import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  responseType?: 'json' | 'text' | 'blob';
}

@Injectable({
  providedIn: 'root'
})
export class ApiHttpService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:9090/v1';

  get<T>(url: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get(this.buildUrl(url), options as any) as Observable<T>;
  }

  post<T>(url: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.post(this.buildUrl(url), body, options as any) as Observable<T>;
  }

  put<T>(url: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.put(this.buildUrl(url), body, options as any) as Observable<T>;
  }

  patch<T>(url: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch(this.buildUrl(url), body, options as any) as Observable<T>;
  }

  delete<T>(url: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete(this.buildUrl(url), options as any) as Observable<T>;
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }
}
