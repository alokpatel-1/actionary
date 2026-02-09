import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseTrackerComponent } from './expense-tracker.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary.component';
import { ExpenseSettingsComponent } from './components/expense-settings/expense-settings.component';

const routes: Routes = [
  {
    path: '',
    component: ExpenseTrackerComponent,
    children: [
      { path: 'list', component: ExpenseListComponent },
      { path: 'add', component: ExpenseFormComponent },
      { path: 'edit/:id', component: ExpenseFormComponent },
      { path: 'summary', component: ExpenseSummaryComponent },
      { path: 'settings', component: ExpenseSettingsComponent },
      { path: '', redirectTo: 'list', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenseTrackerRoutingModule { }
