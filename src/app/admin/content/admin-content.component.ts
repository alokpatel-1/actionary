import { Component, OnInit, signal, inject } from '@angular/core';
import { AdminService, AdminNote } from '../services/admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-content',
  standalone: false,
  templateUrl: './admin-content.component.html',
  styleUrl: './admin-content.component.scss'
})
export class AdminContentComponent implements OnInit {
  notes = signal<AdminNote[]>([]);
  isLoading = signal(true);
  
  // Pagination & Filters
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  searchQuery = signal('');
  statusFilter = signal('ALL');

  // Confirm Dialog State
  isConfirmOpen = false;
  noteToModerate: AdminNote | null = null;
  confirmTitle = '';
  confirmMessage = '';
  confirmActionText = 'Moderate Note';
  pendingAction: 'MODERATE' | 'RESTORE' | null = null;

  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  min = Math.min;

  ngOnInit() {
    this.fetchNotes();
  }

  fetchNotes() {
    this.isLoading.set(true);
    this.adminService.getNotes(this.currentPage(), this.pageSize(), this.searchQuery(), this.statusFilter()).subscribe({
      next: (res) => {
        if (res.success) {
          this.notes.set(res.data);
          this.totalRecords.set(res.total);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch notes' });
      }
    });
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.currentPage.set(1);
    this.fetchNotes();
  }

  onStatusFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(val);
    this.currentPage.set(1);
    this.fetchNotes();
  }

  nextPage() {
    if ((this.currentPage() * this.pageSize()) < this.totalRecords()) {
      this.currentPage.update(p => p + 1);
      this.fetchNotes();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.fetchNotes();
    }
  }

  // --- Bulk Actions ---
  selectedNotes = signal<Set<string>>(new Set());

  toggleAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedNotes.set(new Set(this.notes().map(n => n._id)));
    } else {
      this.selectedNotes.set(new Set());
    }
  }

  toggleNoteSelection(id: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.selectedNotes());
    if (isChecked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    this.selectedNotes.set(current);
  }

  bulkModerate() {
    const ids = Array.from(this.selectedNotes());
    if (ids.length === 0) return;

    ids.forEach(id => {
      this.adminService.moderateNote(id, 'MODERATED').subscribe();
    });

    this.messageService.add({ severity: 'success', summary: 'Bulk Action', detail: `Moderated ${ids.length} notes` });
    this.selectedNotes.set(new Set());
    this.fetchNotes();
  }

  openModerateConfirm(note: AdminNote) {
    this.noteToModerate = note;
    this.confirmTitle = 'Moderate Content';
    this.confirmMessage = `Are you sure you want to flag "${note.title}"? This will hide it from the public feed.`;
    this.confirmActionText = 'Moderate';
    this.pendingAction = 'MODERATE';
    this.isConfirmOpen = true;
  }

  openRestoreConfirm(note: AdminNote) {
    this.noteToModerate = note;
    this.confirmTitle = 'Restore Content';
    this.confirmMessage = `Are you sure you want to restore "${note.title}"? This will make it publicly visible again.`;
    this.confirmActionText = 'Restore';
    this.pendingAction = 'RESTORE';
    this.isConfirmOpen = true;
  }

  confirmModerate() {
    if (!this.noteToModerate || !this.pendingAction) return;
    
    if (this.pendingAction === 'MODERATE') {
      this.adminService.moderateNote(this.noteToModerate._id, 'MODERATED').subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Moderated', detail: 'Note has been moderated.' });
          this.fetchNotes();
        }
      });
    } else if (this.pendingAction === 'RESTORE') {
      this.adminService.moderateNote(this.noteToModerate._id, 'PUBLISHED').subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Restored', detail: 'Note has been published.' });
          this.fetchNotes();
        }
      });
    }
    
    this.closeConfirm();
  }

  closeConfirm() {
    this.isConfirmOpen = false;
    this.noteToModerate = null;
    this.pendingAction = null;
  }
}
