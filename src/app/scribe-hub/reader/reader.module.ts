import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { ReaderRoutingModule } from './reader-routing.module';

import { ReaderComponent } from './reader.component';
import { FeedComponent } from './feed/feed.component';
import { NoteViewComponent } from './note-view/note-view.component';

@NgModule({
  declarations: [
    ReaderComponent,
    FeedComponent,
    NoteViewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReaderRoutingModule
  ]
})
export class ReaderModule { }
