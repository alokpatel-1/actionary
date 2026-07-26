import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';
import { adminGuard } from './gaurds/admin.guard';

export const routes: Routes = [
  // Modular Application Routes
  { path: 'home', redirectTo: 'reader/feed', pathMatch: 'full' },
  { path: 'trending', redirectTo: 'reader/trending', pathMatch: 'full' },
  { path: 'notes', redirectTo: 'publisher/dashboard', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'auth/profile', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'publisher', canActivate: [authGuard], loadChildren: () => import('./publisher/publisher.module').then(m => m.PublisherModule) },
  { path: 'reader', loadChildren: () => import('./reader/reader.module').then(m => m.ReaderModule) },
  { path: 'admin', canActivate: [adminGuard], loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },

  // Fallback to Scribe Hub Modular Application
  { path: '', redirectTo: 'reader/feed', pathMatch: 'full' },
  { path: '**', redirectTo: 'reader/feed', pathMatch: 'full' },
];
