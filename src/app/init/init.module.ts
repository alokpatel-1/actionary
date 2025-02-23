import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InitRoutingModule } from './init-routing.module';
import { InitComponent } from './init.component';
import { LandingAppComponent } from './landing-app/landing-app.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { ImportsModule } from '../imports';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [
    InitComponent,
    LandingAppComponent,
    SignInComponent,
    SignUpComponent
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
