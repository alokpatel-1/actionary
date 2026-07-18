import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, UserAdminData } from './services/admin.service';
import { Note, QuickThought } from '../study-notes/models/note.model';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  public router = inject(Router);

  users = signal<UserAdminData[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  selectedUser = signal<UserAdminData | null>(null);
  selectedNote = signal<Note | null>(null);
  activeUserTab = signal<'notes' | 'thoughts' | 'folders'>('notes');

  // Overall system statistics
  totalUsers = computed(() => this.users().length);
  totalNotes = computed(() => this.users().reduce((acc, u) => acc + u.notesCount, 0));
  totalThoughts = computed(() => this.users().reduce((acc, u) => acc + u.thoughtsCount, 0));
  totalFolders = computed(() => this.users().reduce((acc, u) => acc + u.foldersCount, 0));

  // Search filter
  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.adminService.fetchAllUsersData().subscribe({
      next: (data) => {
        this.users.set(data);
        if (data.length > 0 && !this.selectedUser()) {
          this.selectedUser.set(data[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Admin] Error loading user data:', err);
        this.loading.set(false);
      }
    });
  }

  selectUser(user: UserAdminData): void {
    this.selectedUser.set(user);
    this.selectedNote.set(null);
  }

  inspectNote(note: Note): void {
    this.selectedNote.set(note);
  }

  closeNoteModal(): void {
    this.selectedNote.set(null);
  }
}
