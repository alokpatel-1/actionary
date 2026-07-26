import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  _id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  permissions: string[];
  createdAt: string;
}

export interface AdminNote {
  _id: string;
  title: string;
  owner: { name: string; email: string };
  status: 'DRAFT' | 'PUBLISHED' | 'MODERATED';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private mockUsers: User[] = [
    { _id: '1', name: 'John Doe', email: 'john@example.com', status: 'ACTIVE', permissions: ['READ_NOTES', 'CREATE_NOTES', 'PUBLISH_NOTES'], createdAt: '2023-01-15T10:00:00Z' },
    { _id: '2', name: 'Alice Smith', email: 'alice@example.com', status: 'SUSPENDED', permissions: ['READ_NOTES'], createdAt: '2023-04-22T10:00:00Z' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'BANNED', permissions: [], createdAt: '2023-06-10T10:00:00Z' },
    { _id: '4', name: 'Emma Wilson', email: 'emma.w@example.com', status: 'ACTIVE', permissions: ['READ_NOTES', 'CREATE_NOTES'], createdAt: '2023-07-01T10:00:00Z' },
    { _id: '5', name: 'Michael Brown', email: 'mbrown@example.com', status: 'ACTIVE', permissions: ['READ_NOTES', 'PUBLISH_NOTES'], createdAt: '2023-08-05T10:00:00Z' },
    { _id: '6', name: 'Sarah Davis', email: 'sarah.d@example.com', status: 'SUSPENDED', permissions: ['READ_NOTES'], createdAt: '2023-08-20T10:00:00Z' }
  ];

  private mockNotes: AdminNote[] = [
    { _id: '101', title: 'Understanding Redis Architecture', owner: { name: 'John Doe', email: 'john@example.com' }, status: 'PUBLISHED', createdAt: '2023-08-12T10:00:00Z' },
    { _id: '102', title: 'Why Angular 17 is a game changer', owner: { name: 'Alice Smith', email: 'alice@example.com' }, status: 'PUBLISHED', createdAt: '2023-08-14T10:00:00Z' },
    { _id: '103', title: 'Inappropriate Content Example', owner: { name: 'Bob Johnson', email: 'bob@example.com' }, status: 'MODERATED', createdAt: '2023-08-15T10:00:00Z' },
    { _id: '104', title: 'Getting started with Docker', owner: { name: 'Emma Wilson', email: 'emma.w@example.com' }, status: 'PUBLISHED', createdAt: '2023-08-18T10:00:00Z' },
    { _id: '105', title: 'Spam note promoting crypto', owner: { name: 'Michael Brown', email: 'mbrown@example.com' }, status: 'MODERATED', createdAt: '2023-08-20T10:00:00Z' }
  ];

  getUsers(page = 1, limit = 10, search = '', statusFilter = 'ALL'): Observable<any> {
    let filtered = this.mockUsers.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return of({ success: true, data: paginated, total }).pipe(delay(500));
  }

  updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): Observable<any> {
    const user = this.mockUsers.find(u => u._id === id);
    if (user) {
      user.status = status;
      this.logAudit('updateUserStatus', `User ${user.name} status changed to ${status}`);
    }
    return of({ success: true, data: user }).pipe(delay(300));
  }

  updateUserPermissions(id: string, permissions: string[]): Observable<any> {
    const user = this.mockUsers.find(u => u._id === id);
    if (user) {
      user.permissions = permissions;
      this.logAudit('updateUserPermissions', `User ${user.name} permissions updated to ${permissions.join(', ')}`);
    }
    return of({ success: true, data: user }).pipe(delay(300));
  }

  getNotes(page = 1, limit = 10, search = '', statusFilter = 'ALL'): Observable<any> {
    let filtered = this.mockNotes.filter(n => n.status !== 'DRAFT'); // Always exclude DRAFT
    
    filtered = filtered.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.owner.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
      return matchSearch && matchStatus;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return of({ success: true, data: paginated, total }).pipe(delay(500));
  }

  moderateNote(id: string, status: 'DRAFT' | 'PUBLISHED' | 'MODERATED'): Observable<any> {
    const note = this.mockNotes.find(n => n._id === id);
    if (note) note.status = status;
    this.logAudit('moderateNote', `Note ${id} status changed to ${status}`);
    return of({ success: true, data: note }).pipe(delay(300));
  }

  // --- Analytics & Audit ---
  
  private mockAuditLogs: any[] = [];

  private logAudit(action: string, details: string) {
    this.mockAuditLogs.unshift({
      _id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString(),
      adminId: 'mock-admin-id'
    });
  }

  getDashboardMetrics(): Observable<any> {
    const totalUsers = this.mockUsers.length;
    const activeNotes = this.mockNotes.filter(n => n.status === 'PUBLISHED').length;
    const moderatedNotes = this.mockNotes.filter(n => n.status === 'MODERATED').length;
    const bannedUsers = this.mockUsers.filter(n => n.status === 'BANNED').length;

    return of({
      success: true,
      data: {
        totalUsers,
        activeNotes,
        moderatedNotes,
        bannedUsers,
        // Mock chart data
        userGrowth: [10, 25, 45, 60, 85, totalUsers],
        contentStatus: [activeNotes, moderatedNotes, this.mockNotes.length - activeNotes - moderatedNotes]
      }
    }).pipe(delay(400));
  }

  getAuditLogs(page = 1, limit = 10): Observable<any> {
    const total = this.mockAuditLogs.length;
    const start = (page - 1) * limit;
    const paginated = this.mockAuditLogs.slice(start, start + limit);
    return of({ success: true, data: paginated, total }).pipe(delay(400));
  }
}
