import { Component, OnInit, signal, inject } from '@angular/core';
import { AdminService, User } from '../services/admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users = signal<User[]>([]);
  isLoading = signal(true);
  
  // Pagination & Filters
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  searchQuery = signal('');
  statusFilter = signal('ALL');

  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  // Confirm Dialog State
  isConfirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmActionText = '';
  
  pendingAction: 'BULK_SUSPEND' | 'TOGGLE_STATUS' | null = null;
  pendingUser: User | null = null;
  pendingStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | null = null;

  min = Math.min;

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.isLoading.set(true);
    this.adminService.getUsers(this.currentPage(), this.pageSize(), this.searchQuery(), this.statusFilter()).subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data);
          this.totalRecords.set(res.total);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users' });
      }
    });
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.currentPage.set(1);
    this.fetchUsers();
  }

  onStatusFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(val);
    this.currentPage.set(1);
    this.fetchUsers();
  }

  nextPage() {
    if ((this.currentPage() * this.pageSize()) < this.totalRecords()) {
      this.currentPage.update(p => p + 1);
      this.fetchUsers();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.fetchUsers();
    }
  }

  // --- Bulk Actions ---
  selectedUsers = signal<Set<string>>(new Set());

  toggleAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedUsers.set(new Set(this.users().map(u => u._id)));
    } else {
      this.selectedUsers.set(new Set());
    }
  }

  toggleUserSelection(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.selectedUsers());
    if (isChecked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    this.selectedUsers.set(current);
  }

  openBulkConfirm() {
    this.confirmTitle = 'Suspend Users';
    this.confirmMessage = `Are you sure you want to suspend ${this.selectedUsers().size} users? They will be unable to access the platform.`;
    this.confirmActionText = 'Suspend';
    this.pendingAction = 'BULK_SUSPEND';
    this.isConfirmOpen = true;
  }

  bulkSuspend() {
    const ids = Array.from(this.selectedUsers());
    if (ids.length === 0) return;

    ids.forEach(id => {
      this.adminService.updateUserStatus(id, 'SUSPENDED').subscribe();
    });

    this.messageService.add({ severity: 'success', summary: 'Bulk Action', detail: `Suspended ${ids.length} users` });
    this.selectedUsers.set(new Set());
    this.fetchUsers();
  }

  openConfirm(user: User, newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED') {
    this.confirmTitle = `Confirm Status Change`;
    this.confirmMessage = `Are you sure you want to change ${user.name}'s status to ${newStatus}?`;
    this.confirmActionText = 'Confirm';
    this.pendingUser = user;
    this.pendingStatus = newStatus;
    this.pendingAction = 'TOGGLE_STATUS';
    this.isConfirmOpen = true;
  }

  executeConfirm() {
    if (this.pendingAction === 'BULK_SUSPEND') {
      this.bulkSuspend();
    } else if (this.pendingAction === 'TOGGLE_STATUS' && this.pendingUser && this.pendingStatus) {
      this.toggleStatus(this.pendingUser, this.pendingStatus);
    }
    this.closeConfirm();
  }

  closeConfirm() {
    this.isConfirmOpen = false;
    this.pendingAction = null;
    this.pendingUser = null;
    this.pendingStatus = null;
  }

  toggleStatus(user: User, newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED') {
    this.adminService.updateUserStatus(user._id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          user.status = newStatus;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `User status updated to ${newStatus}` });
        }
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' })
    });
  }

  togglePermission(user: User, permission: string) {
    let updatedPermissions = [...user.permissions];
    if (updatedPermissions.includes(permission)) {
      updatedPermissions = updatedPermissions.filter(p => p !== permission);
    } else {
      updatedPermissions.push(permission);
    }
    
    this.adminService.updateUserPermissions(user._id, updatedPermissions).subscribe({
      next: (res) => {
        if (res.success) {
          user.permissions = updatedPermissions;
          this.messageService.add({ severity: 'info', summary: 'Updated', detail: `Permissions updated for ${user.name}` });
        }
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update permissions' })
    });
  }
}
