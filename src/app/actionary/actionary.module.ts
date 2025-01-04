import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionaryRoutingModule } from './actionary-routing.module';
import { ImportsModule } from '../imports';
import { SidebarComponent } from '../app-layout/sidebar/sidebar.component';
import { TopBarComponent } from '../app-layout/top-bar/top-bar.component';
import { ActionaryComponent } from './actionary.component';


@NgModule({
  declarations: [
    ActionaryComponent
  ],
  imports: [
    CommonModule,
    ActionaryRoutingModule,
    SidebarComponent,
    TopBarComponent
  ]
})
export class ActionaryModule { }
