import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotesLibraryComponent } from './notes-library.component';
import { NoteReaderComponent } from './components/note-reader/note-reader.component';

const routes: Routes = [
  {
    path: '',
    component: NotesLibraryComponent
  },
  {
    path: 'read/:id',
    component: NoteReaderComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesLibraryRoutingModule { }
