import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NoteService } from './services/note.service';
import { Note, NoteFolder, DEFAULT_FOLDERS } from './models/note.model';
import { Popover } from 'primeng/popover';
import { FirebaseAuthService } from '../firebase/firebase-auth.service';

@Component({
  selector: 'app-study-notes',
  standalone: false,
  templateUrl: './study-notes.component.html',
  styleUrl: './study-notes.component.scss'
})
export class StudyNotesComponent implements OnInit {
  public noteService = inject(NoteService);
  private router = inject(Router);
  private firebaseAuthService = inject(FirebaseAuthService);

  sidebarExpanded = signal(true);
  sidebarMobileOpen = signal(false);
  isSidebarFoldersExpanded = signal(true);

  toggleSidebarFolders(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.isSidebarFoldersExpanded.set(!this.isSidebarFoldersExpanded());
  }

  createNewNote(): void {
    this.closeMobileSidebar();
    const activeFid = this.noteService.activeFolderId();
    
    // Check if we are already on the create route to avoid immediately creating a note
    // if the user hasn't typed anything yet, or we can just instantly create it as requested.
    const newNote = {
      title: '',
      content: '',
      folderId: activeFid || '__uncategorized__',
      isPinned: false
    };
    
    this.noteService.addNote(newNote).subscribe(note => {
      this.router.navigate(['/notes', note.id], { queryParams: { edit: 'true' } });
    });
  }

  allNotes = signal<Note[]>([]);
  folders = signal<NoteFolder[]>([]);

  notes = computed(() => {
    const list = this.allNotes();
    const folderId = this.noteService.activeFolderId();
    if (!folderId) {
      return list;
    }
    return list.filter(n => n.folderId === folderId);
  });

  userName = signal('User');
  userEmail = signal('');
  showProfileMenu = signal(false);

  navItems: any[] = [];

  showSearchModal = signal(false);
  searchQuery = signal('');

  showDeleteConfirmModal = signal(false);
  noteToDelete = signal<Note | null>(null);

  showBulkSelectionModal = signal(false);
  selectedNotes = signal<Set<string>>(new Set());

  showArchiveModal = signal(false);
  archivedNotes = signal<Note[]>([]);
  showPermanentDeleteConfirmModal = signal(false);
  noteToPermanentlyDelete = signal<Note | null>(null);

  // Folder options and picker state
  showNoteMenuModal = signal(false);
  showMoveToFolderModal = signal(false);
  selectedMenuNote = signal<Note | null>(null);

  // Sidebar folder actions state
  showFolderMenuModal = signal(false);
  selectedMenuFolder = signal<NoteFolder | null>(null);
  showRenameFolderDialog = signal(false);
  renameFolderTitle = signal('');

  // Create folder state
  showCreateFolderDialog = signal(false);
  createFolderTitle = signal('');

  @ViewChild('noteMenu') noteMenuPopover!: Popover;
  @ViewChild('folderMenu') folderMenuPopover!: Popover;

  ngOnInit(): void {
    this.loadNotes();
    this.loadFolders();
    this.loadUserProfile();

    // Subscribe to note refreshes
    this.noteService.getNotesRefreshObservable().subscribe(() => {
      this.loadNotes();
      this.loadFolders();
    });
  }

  loadFolders(): void {
    this.noteService.getFolders().subscribe(folders => {
      this.folders.set(folders);
    });
  }

  getUserFolders(): NoteFolder[] {
    const systemIds = DEFAULT_FOLDERS.map(f => f.id);
    return this.folders().filter(f => !systemIds.includes(f.id));
  }

  // Sidebar Tree Helpers
  getNotesForFolder(folderId: string): Note[] {
    return this.allNotes().filter(n => n.folderId === folderId);
  }

  getUnassignedNotes(): Note[] {
    return this.allNotes().filter(n => !n.folderId || n.folderId === '__uncategorized__');
  }

  isExpanded(folderId: string): boolean {
    return !!this.noteService.expandedFolders()[folderId];
  }

  toggleFolderExpand(event: Event, folderId: string): void {
    event.stopPropagation();
    const current = this.noteService.expandedFolders();
    this.noteService.expandedFolders.set({
      ...current,
      [folderId]: !current[folderId]
    });
  }

  getFolderNoteCount(folderId: string): number {
    return this.allNotes().filter(n => n.folderId === folderId).length;
  }

  // Sidebar Folder Action Handlers
  openFolderMenu(event: Event, folder: NoteFolder): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedMenuFolder.set(folder);
    if (this.folderMenuPopover) {
      this.folderMenuPopover.toggle(event);
    }
  }

  closeFolderMenu(): void {
    this.selectedMenuFolder.set(null);
    if (this.folderMenuPopover) {
      this.folderMenuPopover.hide();
    }
  }

  triggerCreateNoteInFolder(event: Event, folderId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.noteService.activeFolderId.set(folderId);
    this.router.navigate(['/notes', 'create']);
  }

  triggerRenameFolder(): void {
    const folder = this.selectedMenuFolder();
    this.closeFolderMenu();
    if (folder) {
      this.renameFolderTitle.set(folder.name);
      this.showRenameFolderDialog.set(true);
    }
  }

  saveRenameFolder(): void {
    const folder = this.selectedMenuFolder();
    const newName = this.renameFolderTitle().trim();
    if (!folder || !newName) return;

    this.noteService.updateFolder({ ...folder, name: newName }).subscribe(() => {
      this.loadFolders();
      this.showRenameFolderDialog.set(false);
    });
  }

  triggerCreateFolder(): void {
    this.createFolderTitle.set('');
    this.showCreateFolderDialog.set(true);
  }

  saveCreateFolder(): void {
    const name = this.createFolderTitle().trim();
    if (!name) return;

    this.noteService.addFolder({
      name,
      icon: 'pi-folder',
      color: '#6366F1',
      order: this.folders().length
    }).subscribe(() => {
      this.loadFolders();
      this.showCreateFolderDialog.set(false);
    });
  }

  triggerDeleteFolder(): void {
    const folder = this.selectedMenuFolder();
    this.closeFolderMenu();
    if (folder) {
      this.noteService.deleteFolder(folder.id).subscribe(() => {
        this.selectedMenuFolder.set(null);
        this.loadFolders();
        this.loadNotes();
      });
    }
  }

  toggleNoteMenu(event: Event, note: Note): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedMenuNote.set(note);
    if (this.noteMenuPopover) {
      this.noteMenuPopover.toggle(event);
    }
  }

  closeNoteMenu(): void {
    this.selectedMenuNote.set(null);
    if (this.noteMenuPopover) {
      this.noteMenuPopover.hide();
    }
  }

  triggerMoveToFolder(): void {
    this.closeNoteMenu();
    this.showMoveToFolderModal.set(true);
  }

  closeMoveToFolderModal(): void {
    this.showMoveToFolderModal.set(false);
    this.selectedMenuNote.set(null);
  }

  triggerDeleteFromMenu(): void {
    const note = this.selectedMenuNote();
    this.closeNoteMenu();
    if (note) {
      this.noteToDelete.set(note);
      this.showDeleteConfirmModal.set(true);
    }
  }

  moveNoteToFolder(folderId: string): void {
    const note = this.selectedMenuNote();
    if (!note) return;

    this.noteService.updateNote(note.id, { folderId }).subscribe({
      next: () => {
        this.closeMoveToFolderModal();
        this.noteService.triggerRefresh();
      },
      error: (err) => {
        console.error('Error moving note to folder:', err);
        this.closeMoveToFolderModal();
      }
    });
  }

  isNoteUncategorized(note: Note | null): boolean {
    if (!note) return true;
    return !note.folderId || note.folderId === '__uncategorized__';
  }

  getSelectedNoteFolderName(): string {
    const note = this.selectedMenuNote();
    if (!note || !note.folderId || note.folderId === '__uncategorized__') return 'Folder';
    const folder = this.folders().find(f => f.id === note.folderId);
    return folder ? folder.name : 'Folder';
  }

  removeFromFolder(): void {
    const note = this.selectedMenuNote();
    if (!note) return;

    this.noteService.updateNote(note.id, { folderId: '__uncategorized__' }).subscribe({
      next: () => {
        this.closeNoteMenu();
        this.noteService.triggerRefresh();
      },
      error: (err) => {
        console.error('Error removing note from folder:', err);
        this.closeNoteMenu();
      }
    });
  }

  getActiveFolderName(): string {
    const folderId = this.noteService.activeFolderId();
    if (!folderId) return '';
    const folder = this.folders().find(f => f.id === folderId);
    return folder ? folder.name : '';
  }

  getDisplayTitle(note: Note): string {
    if (note.title && note.title.trim() !== '') return note.title;
    
    if (note.content && note.content.trim() !== '') {
      const div = document.createElement('div');
      div.innerHTML = note.content;
      const text = div.textContent || div.innerText || '';
      const trimmed = text.trim();
      
      if (trimmed) {
        return trimmed.length > 25 ? trimmed.substring(0, 25) + '...' : trimmed;
      }
    }
    
    return 'Untitled Note';
  }

  clearActiveFolder(): void {
    this.noteService.activeFolderId.set(null);
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
      this.allNotes.set(notes);
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

  triggerBulkDelete(): void {
    this.showProfileMenu.set(false);
    this.selectedNotes.set(new Set());
    this.showBulkSelectionModal.set(true);
  }

  closeBulkSelectionModal(): void {
    this.showBulkSelectionModal.set(false);
    this.selectedNotes.set(new Set());
  }

  toggleNoteSelection(noteId: string): void {
    const current = new Set(this.selectedNotes());
    if (current.has(noteId)) {
      current.delete(noteId);
    } else {
      current.add(noteId);
    }
    this.selectedNotes.set(current);
  }

  toggleSelectAll(): void {
    const current = new Set(this.selectedNotes());
    const all = this.allNotes();
    if (current.size === all.length) {
      this.selectedNotes.set(new Set()); // Deselect all
    } else {
      this.selectedNotes.set(new Set(all.map(n => n.id))); // Select all
    }
  }

  confirmBulkDelete(): void {
    const ids = Array.from(this.selectedNotes());
    if (ids.length === 0) {
      this.showBulkSelectionModal.set(false);
      return;
    }

    this.noteService.bulkDeleteNotes(ids).subscribe({
      next: () => {
        this.showBulkSelectionModal.set(false);
        this.selectedNotes.set(new Set());
        this.router.navigate(['/notes', 'create']);
      },
      error: (err) => {
        console.error('Error clearing notes:', err);
        this.showBulkSelectionModal.set(false);
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
