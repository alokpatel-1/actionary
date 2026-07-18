import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InitRoutingModule } from './init-routing.module';
import { InitComponent } from './init.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { MobileLoginComponent } from './auth/mobile-login/mobile-login.component';
import { MobileSignupComponent } from './auth/mobile-signup/mobile-signup.component';
import { ImportsModule } from '../imports';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [
    InitComponent,
    SignInComponent,
    SignUpComponent,
    MobileLoginComponent,
    MobileSignupComponent
  ],
  imports: [
    CommonModule,
    InitRoutingModule,
    ImportsModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class InitModule { }

