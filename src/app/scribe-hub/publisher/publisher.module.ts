import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { PublisherRoutingModule } from './publisher-routing.module';

import { PublisherComponent } from './publisher.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PublisherEditorComponent } from './editor/publisher-editor.component';

import { StudyNotesModule } from '../../study-notes/study-notes.module';

@NgModule({
  declarations: [
    PublisherComponent,
    DashboardComponent,
    PublisherEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    StudyNotesModule,
    PublisherRoutingModule
  ]
})
export class PublisherModule { }
