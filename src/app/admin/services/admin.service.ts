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
  publishedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private mockUsers: User[] = Array.from({ length: 115 }, (_, i) => ({
    _id: (i + 1).toString(),
    name: `Test User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 12 === 0 ? 'BANNED' : (i % 7 === 0 ? 'SUSPENDED' : 'ACTIVE'),
    permissions: i % 4 === 0 ? ['READ_NOTES'] : ['READ_NOTES', 'CREATE_NOTES', 'PUBLISH_NOTES'],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
  }));

  private mockNotes: AdminNote[] = Array.from({ length: 150 }, (_, i) => {
    const created = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
    const published = new Date(created.getTime() + Math.floor(Math.random() * 864000000));
    return {
      _id: (101 + i).toString(),
      title: `Documentation Note ${i + 1} - Overview`,
      owner: { name: `Test User ${i % 25 + 1}`, email: `user${i % 25 + 1}@example.com` },
      status: i % 8 === 0 ? 'MODERATED' : 'PUBLISHED',
      createdAt: created.toISOString(),
      publishedAt: i % 8 === 0 ? undefined : published.toISOString()
    };
  });

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
