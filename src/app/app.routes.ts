import { Routes } from '@angular/router';
import { authGuard } from './gaurds/auth.guard';

export const routes: Routes = [
  { path: 'home', loadChildren: () => import('./init/init.module').then(m => m.InitModule) },
  { path: 'user', canActivate: [authGuard], loadChildren: () => import('./actionary/actionary.module').then(m => m.ActionaryModule) },
  { path: 'expenses', loadChildren: () => import('./expense-tracker/expense-tracker.module').then(m => m.ExpenseTrackerModule) },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
