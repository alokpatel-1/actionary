import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NoteService } from './services/note.service';
import { Note } from './models/note.model';
import { FirebaseAuthService } from '../firebase/firebase-auth.service';

@Component({
  selector: 'app-study-notes',
  standalone: false,
  templateUrl: './study-notes.component.html',
  styleUrl: './study-notes.component.scss'
})
export class StudyNotesComponent implements OnInit {
  private noteService = inject(NoteService);
  private router = inject(Router);
  private firebaseAuthService = inject(FirebaseAuthService);

  sidebarExpanded = signal(true);
  sidebarMobileOpen = signal(false);

  notes = signal<Note[]>([]);
  userName = signal('User');
  userEmail = signal('');
  showProfileMenu = signal(false);

  navItems: any[] = [];

  showSearchModal = signal(false);
  searchQuery = signal('');

  showDeleteConfirmModal = signal(false);
  noteToDelete = signal<Note | null>(null);

  showArchiveModal = signal(false);
  archivedNotes = signal<Note[]>([]);
  showPermanentDeleteConfirmModal = signal(false);
  noteToPermanentlyDelete = signal<Note | null>(null);

  ngOnInit(): void {
    this.loadNotes();
    this.loadUserProfile();

    // Subscribe to note refreshes
    this.noteService.getNotesRefreshObservable().subscribe(() => {
      this.loadNotes();
    });
  }

  openSearchModal(): void {
    this.searchQuery.set('');
    this.showSearchModal.set(true);
  }

  closeSearchModal(): void {
    this.showSearchModal.set(false);
  }

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  selectNoteFromSearch(note: Note): void {
    this.closeSearchModal();
    this.openNote(note);
  }

  createNewNoteFromSearch(): void {
    this.closeSearchModal();
    this.router.navigate(['/notes', 'create']);
  }

  filteredNotesForSearch(): Note[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) {
      return this.notes().slice(0, 5); // top 5 recent notes
    }
    return this.notes().filter(note =>
      (note.title || '').toLowerCase().includes(q) ||
      (note.content || '').toLowerCase().includes(q)
    );
  }

  loadNotes(): void {
    this.noteService.getAllNotes().subscribe(notes => {
      this.notes.set(notes);
    });
  }

  loadUserProfile(): void {
    if (typeof sessionStorage !== 'undefined') {
      const userStr = sessionStorage.getItem('user');
      const emailVal = sessionStorage.getItem('email');
      const displayNameVal = sessionStorage.getItem('displayName');

      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          this.userName.set(userObj.displayName || userObj.username || displayNameVal || 'User');
          this.userEmail.set(userObj.email || (emailVal ? emailVal.replace(/"/g, '') : ''));
        } catch (e) {
          this.userName.set(displayNameVal || 'User');
          this.userEmail.set(emailVal ? emailVal.replace(/"/g, '') : '');
        }
      } else {
        this.userName.set(displayNameVal || 'User');
        this.userEmail.set(emailVal ? emailVal.replace(/"/g, '') : '');
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded.set(!this.sidebarExpanded());
  }

  toggleMobileSidebar(): void {
    this.sidebarMobileOpen.set(!this.sidebarMobileOpen());
  }

  closeMobileSidebar(): void {
    this.sidebarMobileOpen.set(false);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  logout(): void {
    this.firebaseAuthService.signOut().then(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      this.router.navigate(['/home/auth/login']);
    });
  }

  getActiveNoteId(): string | null {
    const parts = this.router.url.split('/');
    const editIndex = parts.indexOf('edit');
    if (editIndex !== -1 && editIndex + 1 < parts.length) {
      return parts[editIndex + 1];
    }
    return null;
  }

  openNote(note: Note): void {
    this.router.navigate(['/notes', 'edit', note.id]);
    this.closeMobileSidebar();
  }

  deleteNoteFromSidebar(event: Event, note: Note): void {
    event.stopPropagation();
    event.preventDefault();
    this.noteToDelete.set(note);
    this.showDeleteConfirmModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal.set(false);
    this.noteToDelete.set(null);
  }

  confirmDelete(): void {
    const note = this.noteToDelete();
    if (!note) return;

    const isActive = this.getActiveNoteId() === note.id;
    this.noteService.deleteNote(note.id).subscribe({
      next: () => {
        this.showDeleteConfirmModal.set(false);
        this.noteToDelete.set(null);
        if (isActive) {
          this.router.navigate(['/notes', 'create']);
        }
      },
      error: (err) => {
        console.error('Error deleting note from sidebar:', err);
        this.showDeleteConfirmModal.set(false);
        this.noteToDelete.set(null);
      }
    });
  }

  openArchiveModal(): void {
    this.showProfileMenu.set(false);
    this.loadArchivedNotes();
    this.showArchiveModal.set(true);
  }

  closeArchiveModal(): void {
    this.showArchiveModal.set(false);
  }

  loadArchivedNotes(): void {
    this.noteService.getDeletedNotes().subscribe(notes => {
      this.archivedNotes.set(notes);
    });
  }

  restoreNote(note: Note): void {
    this.noteService.restoreNote(note.id).subscribe({
      next: () => {
        this.loadArchivedNotes();
      },
      error: (err) => {
        console.error('Error restoring note:', err);
      }
    });
  }

  triggerPermanentDelete(note: Note): void {
    this.noteToPermanentlyDelete.set(note);
    this.showPermanentDeleteConfirmModal.set(true);
  }

  cancelPermanentDelete(): void {
    this.showPermanentDeleteConfirmModal.set(false);
    this.noteToPermanentlyDelete.set(null);
  }

  confirmPermanentDelete(): void {
    const note = this.noteToPermanentlyDelete();
    if (!note) return;

    this.noteService.permanentlyDeleteNote(note.id).subscribe({
      next: () => {
        this.showPermanentDeleteConfirmModal.set(false);
        this.noteToPermanentlyDelete.set(null);
        this.loadArchivedNotes();
      },
      error: (err) => {
        console.error('Error permanently deleting note:', err);
        this.showPermanentDeleteConfirmModal.set(false);
        this.noteToPermanentlyDelete.set(null);
      }
    });
  }

  getNotePreview(content: string): string {
    const text = (content || '').replace(/<[^>]*>/g, '').trim();
    return text.length > 35 ? text.substring(0, 35) + '…' : text;
  }

  getUserInitials(): string {
    const name = this.userName();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
