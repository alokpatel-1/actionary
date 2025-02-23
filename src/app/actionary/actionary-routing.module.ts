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
      { path: 'upcoming', component: UpcomingTaskComponent },
      { path: 'tasks', component: TodaysTaskComponent },
      { path: 'create', component: CreateTaskComponent },
      { path: 'pending', component: PendingTasksComponent },
      { path: 'calender-view', component: CalenderViewComponent },
      { path: '', redirectTo: 'tasks', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActionaryRoutingModule { }
