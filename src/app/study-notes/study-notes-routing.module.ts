import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudyNotesComponent } from './study-notes.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { NoteFoldersComponent } from './components/note-folders/note-folders.component';
import { NoteSearchComponent } from './components/note-search/note-search.component';

const routes: Routes = [
  {
    path: '',
    component: StudyNotesComponent,
    children: [
      { path: 'create', component: NoteEditorComponent },
      { path: 'folders', component: NoteFoldersComponent },
      { path: 'new', redirectTo: 'create', pathMatch: 'full' },
      { path: 'edit/:id', component: NoteEditorComponent },
      { path: '', redirectTo: 'create', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudyNotesRoutingModule { }
