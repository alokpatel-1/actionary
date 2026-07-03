import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudyNotesRoutingModule } from './study-notes-routing.module';
import { ImportsModule } from '../imports';
import { StudyNotesComponent } from './study-notes.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { NoteFoldersComponent } from './components/note-folders/note-folders.component';
import { NoteSearchComponent } from './components/note-search/note-search.component';

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
    ImportsModule
  ]
})
export class StudyNotesModule { }
