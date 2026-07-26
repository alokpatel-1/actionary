import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminContentComponent } from './content/admin-content.component';
import { AdminContentViewComponent } from './content-view/admin-content-view.component';
import { AdminAuditComponent } from './audit/admin-audit.component';
import { SharedModule } from '../shared/shared.module';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminSidebarComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminContentComponent,
    AdminContentViewComponent,
    AdminAuditComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    BaseChartDirective
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class AdminModule { }
