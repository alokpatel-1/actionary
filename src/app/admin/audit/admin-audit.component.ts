import { Component, OnInit, signal, inject } from '@angular/core';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-audit',
  standalone: false,
  templateUrl: './admin-audit.component.html',
  styleUrl: './admin-audit.component.scss'
})
export class AdminAuditComponent implements OnInit {
  logs = signal<any[]>([]);
  isLoading = signal(true);
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(15);
  totalRecords = signal(0);

  private adminService = inject(AdminService);
  min = Math.min;

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading.set(true);
    this.adminService.getAuditLogs(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        if (res.success) {
          this.logs.set(res.data);
          this.totalRecords.set(res.total);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load audit logs', err);
      }
    });
  }

  nextPage() {
    if ((this.currentPage() * this.pageSize()) < this.totalRecords()) {
      this.currentPage.update(p => p + 1);
      this.fetchLogs();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.fetchLogs();
    }
  }
}
