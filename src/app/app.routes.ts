import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';
import { adminGuard } from './gaurds/admin.guard';

export const routes: Routes = [
  // Modular Application Routes under /new/ prefix
  { path: 'new/home', redirectTo: 'new/reader/feed', pathMatch: 'full' },
  { path: 'new/trending', redirectTo: 'new/reader/trending', pathMatch: 'full' },
  { path: 'new/notes', redirectTo: 'new/publisher/dashboard', pathMatch: 'full' },
  { path: 'new/profile', redirectTo: 'new/auth/profile', pathMatch: 'full' },
  { path: 'new/auth', loadChildren: () => import('./scribe-hub/auth/auth.module').then(m => m.AuthModule) },
  { path: 'new/publisher', canActivate: [authGuard], loadChildren: () => import('./scribe-hub/publisher/publisher.module').then(m => m.PublisherModule) },
  { path: 'new/reader', loadChildren: () => import('./scribe-hub/reader/reader.module').then(m => m.ReaderModule) },

  // Existing Firebase Application Routes (Untouched)
  { path: 'notes', canActivate: [authGuard], loadChildren: () => import('./study-notes/study-notes.module').then(m => m.StudyNotesModule) },
  { path: 'library', canActivate: [authGuard], loadChildren: () => import('./notes-library/notes-library.module').then(m => m.NotesLibraryModule) },
  { path: 'admin', canActivate: [authGuard, adminGuard], loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
  { path: '', loadChildren: () => import('./init/init.module').then(m => m.InitModule) },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
