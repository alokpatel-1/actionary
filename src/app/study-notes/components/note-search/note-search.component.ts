import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { Note, NoteFolder } from '../../models/note.model';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-note-search',
  standalone: false,
  templateUrl: './note-search.component.html',
  styleUrl: './note-search.component.scss'
})
export class NoteSearchComponent implements OnInit, OnDestroy {
  private noteService = inject(NoteService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  query = signal('');
  results = signal<Note[]>([]);
  folders = signal<NoteFolder[]>([]);
  searching = signal(false);
  hasSearched = signal(false);

  readonly folderMap = computed(() => {
    const m = new Map<string, NoteFolder>();
    this.folders().forEach(f => m.set(f.id, f));
    return m;
  });

  ngOnInit(): void {
    this.noteService.getFolders().subscribe(f => this.folders.set(f));

    this.search$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      if (q.trim()) {
        this.searching.set(true);
        this.noteService.searchNotes(q).subscribe(notes => {
          this.results.set(notes);
          this.searching.set(false);
          this.hasSearched.set(true);
        });
      } else {
        this.results.set([]);
        this.hasSearched.set(false);
      }
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  clearSearch(): void {
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
  }

  openNote(note: Note): void {
    this.router.navigate(['/notes', 'edit', note.id]);
  }

  getFolderColor(folderId: string): string {
    return this.folderMap().get(folderId)?.color ?? '#94A3B8';
  }

  getFolderName(folderId: string): string {
    return this.folderMap().get(folderId)?.name ?? 'General';
  }

  getPreview(html: string): string {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length > 120 ? text.substring(0, 120) + '…' : text;
  }

  getHighlightedTitle(title: string): string {
    const q = this.query().trim();
    if (!q) return title;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return title.replace(regex, '<mark>$1</mark>');
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
