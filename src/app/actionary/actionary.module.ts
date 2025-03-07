import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionaryRoutingModule } from './actionary-routing.module';
import { ImportsModule } from '../imports';
import { SidebarComponent } from '../app-layout/sidebar/sidebar.component';
import { TopBarComponent } from '../app-layout/top-bar/top-bar.component';
import { ActionaryComponent } from './actionary.component';
import { UpcomingTaskComponent } from './components/upcoming-task/upcoming-task.component';
import { CalenderViewComponent } from './components/calender-view/calender-view.component';
import { CreateTaskComponent } from './components/create-task/create-task.component';
import { PendingTasksComponent } from './components/pending-tasks/pending-tasks.component';
import { TodaysTaskComponent } from './components/todays-task/todays-task.component';
import { CdkEditorComponent } from './common/cdk-editor/cdk-editor.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [
    ActionaryComponent,
    UpcomingTaskComponent,
    TodaysTaskComponent,
    CalenderViewComponent,
    CreateTaskComponent,
    PendingTasksComponent,
    CdkEditorComponent,
    TaskListComponent
  ],
  imports: [
    CommonModule,
    ActionaryRoutingModule,
    SidebarComponent,
    TopBarComponent,
    ImportsModule,
    NgxSpinnerModule
  ]
})
export class ActionaryModule { }
