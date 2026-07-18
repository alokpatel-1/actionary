import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublisherComponent } from './publisher.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PublisherEditorComponent } from './editor/publisher-editor.component';

const routes: Routes = [
  {
    path: '',
    component: PublisherComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'editor/:id', component: PublisherEditorComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublisherRoutingModule { }
