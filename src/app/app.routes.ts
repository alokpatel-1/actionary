import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';

export const routes: Routes = [
  { path: 'notes', canActivate: [authGuard], loadChildren: () => import('./study-notes/study-notes.module').then(m => m.StudyNotesModule) },
  { path: 'library', canActivate: [authGuard], loadChildren: () => import('./notes-library/notes-library.module').then(m => m.NotesLibraryModule) },
  { path: '', loadChildren: () => import('./init/init.module').then(m => m.InitModule) },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
