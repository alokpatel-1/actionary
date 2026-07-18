// Trigger recompile
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudyNotesRoutingModule } from './study-notes-routing.module';
import { ImportsModule } from '../imports';
import { TiptapEditorDirective, TiptapBubbleMenuDirective, TiptapFloatingMenuDirective } from 'ngx-tiptap';
import { StudyNotesComponent } from './study-notes.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { NoteFoldersComponent } from './components/note-folders/note-folders.component';
import { NoteSearchComponent } from './components/note-search/note-search.component';
import { ConfirmationService } from 'primeng/api';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

class MockSpinnerService {
  show(): Promise<any> { return Promise.resolve(); }
  hide(): Promise<any> { return Promise.resolve(); }
}

@NgModule({
  declarations: [
    StudyNotesComponent,
    NoteListComponent,
    NoteEditorComponent,
    NoteFoldersComponent,
    NoteSearchComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    StudyNotesRoutingModule,
    ImportsModule,
    TiptapEditorDirective,
    TiptapBubbleMenuDirective,
    TiptapFloatingMenuDirective,
    NgxSpinnerModule
  ],
  providers: [
    ConfirmationService,
    { provide: NgxSpinnerService, useClass: MockSpinnerService }
  ],
  exports: [
    NoteEditorComponent
  ]
})
export class StudyNotesModule { }
