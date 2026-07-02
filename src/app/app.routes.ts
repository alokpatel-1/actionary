import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';

export const routes: Routes = [
  { path: 'home', loadChildren: () => import('./init/init.module').then(m => m.InitModule) },
  // { path: 'user', canActivate: [authGuard], loadChildren: () => import('./actionary/actionary.module').then(m => m.ActionaryModule) },
  // { path: 'expenses', canActivate: [authGuard], loadChildren: () => import('./expense-tracker/expense-tracker.module').then(m => m.ExpenseTrackerModule) },
  { path: 'notes', canActivate: [authGuard], loadChildren: () => import('./study-notes/study-notes.module').then(m => m.StudyNotesModule) },
  { path: '', redirectTo: 'notes', pathMatch: 'full' },
  { path: '**', redirectTo: 'notes', pathMatch: 'full' },
];
