import { Routes } from '@angular/router';
import { PendingTasksComponent } from './components/pending-tasks/pending-tasks.component';

export const routes: Routes = [
  { path: 'tasks', component: PendingTasksComponent, pathMatch: 'full' },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: '**', redirectTo: 'tasks', pathMatch: 'full' },
];
