import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  metrics = signal<any>(null);
  isLoading = signal(true);

  private adminService = inject(AdminService);

  // Line Chart Config (User Growth)
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Users Joined',
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: '#0ea5e9',
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0ea5e9',
        fill: 'origin',
      }
    ],
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July']
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  };

  // Doughnut Chart Config (Content Status)
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Published', 'Moderated', 'Drafts'],
    datasets: [
      { data: [], backgroundColor: ['#10b981', '#f59e0b', '#64748b'] }
    ]
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnInit() {
    this.adminService.getDashboardMetrics().subscribe({
      next: (res) => {
        if (res.success) {
          this.metrics.set(res.data);
          
          // Update Charts
          this.lineChartData.datasets[0].data = res.data.userGrowth;
          this.lineChartData = { ...this.lineChartData }; // Trigger change detection
          
          this.doughnutChartData.datasets[0].data = res.data.contentStatus;
          this.doughnutChartData = { ...this.doughnutChartData };
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load metrics', err);
      }
    });
  }
}
