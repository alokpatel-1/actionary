import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./init/init.module').then(m => m.InitModule) },
  { path: 'user', loadChildren: () => import('./actionary/actionary.module').then(m => m.ActionaryModule) },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
