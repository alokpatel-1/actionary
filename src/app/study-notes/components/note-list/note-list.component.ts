import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { NoteSyncService } from '../../services/note-sync.service';
import { Note, NoteFolder } from '../../models/note.model';

@Component({
  selector: 'app-note-list',
  standalone: false,
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.scss'
})
export class NoteListComponent implements OnInit {
  private noteService = inject(NoteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly syncService = inject(NoteSyncService);

  notes = signal<Note[]>([]);
  folders = signal<NoteFolder[]>([]);
  selectedFolderId = signal<string | null>(null);
  loading = signal(true);

  readonly pinnedNotes = computed(() => this.notes().filter(n => n.isPinned));
  readonly unpinnedNotes = computed(() => this.notes().filter(n => !n.isPinned));
  readonly hasNotes = computed(() => this.notes().length > 0);

  readonly folderMap = computed(() => {
    const m = new Map<string, NoteFolder>();
    this.folders().forEach(f => m.set(f.id, f));
    return m;
  });

  ngOnInit(): void {
    this.loadFolders();
    // Read folder query param from sidebar folder clicks
    this.route.queryParams.subscribe(params => {
      const folderId = params['folder'] || null;
      this.selectedFolderId.set(folderId);
      this.loadNotes();
    });
    this.syncService.tryAutoSync();
  }

  loadFolders(): void {
    this.noteService.getFolders().subscribe(folders => this.folders.set(folders));
  }

  loadNotes(): void {
    this.loading.set(true);
    const folderId = this.selectedFolderId();
    const source = folderId
      ? this.noteService.getNotesByFolder(folderId)
      : this.noteService.getAllNotes();

    source.subscribe(notes => {
      this.notes.set(notes);
      this.loading.set(false);
    });
  }

  selectFolder(folderId: string | null): void {
    this.selectedFolderId.set(folderId);
    this.loadNotes();
  }

  openNote(note: Note): void {
    this.router.navigate(['/notes', 'edit', note.id]);
  }

  createNote(): void {
    this.router.navigate(['/notes', 'create']);
  }

  togglePin(event: Event, note: Note): void {
    event.stopPropagation();
    this.noteService.togglePin(note.id).subscribe(() => this.loadNotes());
  }

  deleteNote(event: Event, note: Note): void {
    event.stopPropagation();
    this.noteService.deleteNote(note.id).subscribe(() => this.loadNotes());
  }

  getFolderColor(folderId: string): string {
    return this.folderMap().get(folderId)?.color ?? '#94A3B8';
  }

  getFolderName(folderId: string): string {
    return this.folderMap().get(folderId)?.name ?? 'General';
  }

  getPreview(html: string): string {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '…' : text;
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
