import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';

export const routes: Routes = [
  // Modular Application Routes under /new/ prefix
  { path: 'new/home', redirectTo: 'new/reader/feed', pathMatch: 'full' },
  { path: 'new/trending', redirectTo: 'new/reader/trending', pathMatch: 'full' },
  { path: 'new/notes', redirectTo: 'new/publisher/dashboard', pathMatch: 'full' },
  { path: 'new/profile', redirectTo: 'new/auth/profile', pathMatch: 'full' },
  { path: 'new/auth', loadChildren: () => import('./scribe-hub/auth/auth.module').then(m => m.AuthModule) },
  { path: 'new/publisher', canActivate: [authGuard], loadChildren: () => import('./scribe-hub/publisher/publisher.module').then(m => m.PublisherModule) },
  { path: 'new/reader', loadChildren: () => import('./scribe-hub/reader/reader.module').then(m => m.ReaderModule) },

  // Fallback to Scribe Hub Modular Application
  { path: '', redirectTo: 'new/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'new/home', pathMatch: 'full' },
];
