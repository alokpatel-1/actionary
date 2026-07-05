// Trigger recompile
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesLibraryRoutingModule } from './notes-library-routing.module';
import { NotesLibraryComponent } from './notes-library.component';
import { NoteReaderComponent } from './components/note-reader/note-reader.component';
import { LibraryNavbarComponent } from './components/library-navbar/library-navbar.component';

@NgModule({
  declarations: [
    NotesLibraryComponent,
    NoteReaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NotesLibraryRoutingModule,
    LibraryNavbarComponent
  ]
})
export class NotesLibraryModule { }
