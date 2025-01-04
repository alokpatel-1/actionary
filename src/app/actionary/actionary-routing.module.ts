import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActionaryComponent } from './actionary.component';
import { CalenderViewComponent } from './components/calender-view/calender-view.component';
import { CreateTaskComponent } from './components/create-task/create-task.component';
import { PendingTasksComponent } from './components/pending-tasks/pending-tasks.component';
import { TodaysTaskComponent } from './components/todays-task/todays-task.component';
import { UpcomingTaskComponent } from './components/upcoming-task/upcoming-task.component';

const routes: Routes = [
  {
    path: '', component: ActionaryComponent,
    children: [
      { path: 'upcoming', component: UpcomingTaskComponent, pathMatch: 'full' },
      { path: 'tasks', component: TodaysTaskComponent, pathMatch: 'full' },
      { path: 'create', component: CreateTaskComponent, pathMatch: 'full' },
      { path: 'pending', component: PendingTasksComponent, pathMatch: 'full' },
      { path: 'calender-view', component: CalenderViewComponent, pathMatch: 'full' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionaryRoutingModule { }
