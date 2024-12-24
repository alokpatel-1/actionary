import { Routes } from '@angular/router';
import { PendingTasksComponent } from './components/pending-tasks/pending-tasks.component';
import { UpcomingTaskComponent } from './components/upcoming-task/upcoming-task.component';
import { CreateTaskComponent } from './components/create-task/create-task.component';
import { TodaysTaskComponent } from './components/todays-task/todays-task.component';
import { CalenderViewComponent } from './components/calender-view/calender-view.component';

export const routes: Routes = [
  { path: 'upcoming', component: UpcomingTaskComponent, pathMatch: 'full' },
  { path: 'tasks', component: TodaysTaskComponent, pathMatch: 'full' },
  { path: 'create', component: CreateTaskComponent, pathMatch: 'full' },
  { path: 'pending', component: PendingTasksComponent, pathMatch: 'full' },
  { path: 'calender-view', component: CalenderViewComponent, pathMatch: 'full' },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: '**', redirectTo: 'tasks', pathMatch: 'full' },
];
