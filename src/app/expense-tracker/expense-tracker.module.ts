import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExpenseTrackerRoutingModule } from './expense-tracker-routing.module';
import { ImportsModule } from '../imports';
import { ExpenseTrackerComponent } from './expense-tracker.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary.component';
import { ExpenseSettingsComponent } from './components/expense-settings/expense-settings.component';

@NgModule({
  declarations: [
    ExpenseTrackerComponent,
    ExpenseListComponent,
    ExpenseFormComponent,
    ExpenseSummaryComponent,
    ExpenseSettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ExpenseTrackerRoutingModule,
    ImportsModule
  ]
})
export class ExpenseTrackerModule { }
