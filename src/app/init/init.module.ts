import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InitRoutingModule } from './init-routing.module';
import { LandingAppComponent } from './landing-app/landing-app.component';


@NgModule({
  declarations: [LandingAppComponent],
  imports: [
    CommonModule,
    InitRoutingModule
  ]
})
export class InitModule { }
