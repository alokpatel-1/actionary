import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiHttpService } from './api/api-http.service';
import { AuthTokenService } from './auth/auth-token.service';
import { AuthInterceptor } from './api/auth.interceptor';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    ApiHttpService,
    AuthTokenService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in root app module only.');
    }
  }
}
