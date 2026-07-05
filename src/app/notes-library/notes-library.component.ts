import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NoteService } from '../study-notes/services/note.service';
import { NoteIdbService } from '../study-notes/services/note-idb.service';
import { Note, NoteFolder, QuickThought } from '../study-notes/models/note.model';
import { v4 as uuidv4 } from 'uuid';

type SortOrder = 'created' | 'edited' | 'az';

@Component({
  selector: 'app-notes-library',
  templateUrl: './notes-library.component.html',
  styleUrls: ['./notes-library.component.scss'],
  standalone: false
})
export class NotesLibraryComponent implements OnInit, OnDestroy {
  private noteService = inject(NoteService);
  private idbService = inject(NoteIdbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  folders = signal<NoteFolder[]>([]);
  notes = signal<Note[]>([]);
  thoughts = signal<QuickThought[]>([]);
  
  // Tab switcher
  activeTab = signal<'notes' | 'thoughts'>('notes');
  editingThought = signal<QuickThought | null>(null);
  isEditingThoughtMode = signal(false);
  thoughtEditText = signal('');

  searchQuery = signal('');
  sortOrder = signal<SortOrder>('created');
  selectedTag = signal<string | null>(null);
  filterFolderId = signal<string | null>(null);

  // Recent searches
  recentSearches = signal<string[]>(this.loadRecentSearches());
  showRecentSearches = signal(false);

  // Filter out system folders from filter sidebar
  visibleFolders = computed(() => {
    return this.folders().filter(f => f.id !== '__uncategorized__' && f.id !== '__quick_notes__');
  });

  // All unique tags from notes
  allTags = computed(() => {
    const tags = new Set<string>();
    this.notes().forEach(note => (note.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  filteredNotes = computed(() => {
    const allNotes = this.notes();
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();
    const folderId = this.filterFolderId();

    let filtered = allNotes.filter(note => {
      // Search filter
      const titleMatch = (note.title || '').toLowerCase().includes(query);
      const contentMatch = (note.content || '').toLowerCase().includes(query);
      const folderName = this.getFolderName(note.folderId).toLowerCase();
      const folderMatch = folderName.includes(query);
      const tagMatch = !query || (note.tags || []).some(t => t.includes(query));
      if (query && !titleMatch && !contentMatch && !folderMatch && !tagMatch) return false;

      // Tag filter
      if (tag && !(note.tags || []).includes(tag)) return false;

      // Folder filter
      if (folderId && note.folderId !== folderId) return false;

      return true;
    });

    // Sort
    const order = this.sortOrder();
    if (order === 'created') {
      filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (order === 'edited') {
      filtered = filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (order === 'az') {
      filtered = filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return filtered;
  });

  filteredThoughts = computed(() => {
    const allThoughts = this.thoughts();
    const query = this.searchQuery().toLowerCase().trim();

    let filtered = allThoughts.filter(t => {
      const match = (t.text || '').toLowerCase().includes(query);
      return !query || match;
    });

    filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
    return filtered;
  });

  readonly folderMap = computed(() => {
    const m = new Map<string, NoteFolder>();
    this.folders().forEach(f => m.set(f.id, f));
    return m;
  });

  getFolderName(folderId: string): string {
    if (!folderId || folderId === '__uncategorized__') return 'General';
    return this.folderMap().get(folderId)?.name ?? 'General';
  }

  getFolderIcon(folderId: string): string {
    if (!folderId || folderId === '__uncategorized__') return '📁';
    return this.folderMap().get(folderId)?.icon ?? '📁';
  }

  getFolderColor(folderId: string): string {
    if (!folderId || folderId === '__uncategorized__') return '#64748B'; // Slate/Grey default
    return this.folderMap().get(folderId)?.color ?? '#64748B';
  }

  getPrimeIcon(icon: string): string {
    if (!icon) return 'pi pi-folder';
    if (icon.startsWith('pi ')) return icon;
    
    const emojiMap: Record<string, string> = {
      '📁': 'pi pi-folder',
      '📂': 'pi pi-folder-open',
      '📚': 'pi pi-book',
      '📖': 'pi pi-book',
      '📝': 'pi pi-file',
      '⭐': 'pi pi-star',
      '❤️': 'pi pi-heart',
      '⚡': 'pi pi-bolt',
      '💻': 'pi pi-desktop',
      '🎨': 'pi pi-palette',
      '🔬': 'pi pi-info-circle',
      '🧮': 'pi pi-calculator',
      '🌍': 'pi pi-globe',
      '🚀': 'pi pi-send',
      '🎯': 'pi pi-compass',
      '💡': 'pi pi-lightbulb',
      '🔒': 'pi pi-lock',
      '🎵': 'pi pi-volume-up',
      '🏆': 'pi pi-bookmark',
      '🌿': 'pi pi-image',
    };
    return emojiMap[icon] ?? 'pi pi-folder';
  }

  ngOnInit(): void {
    // Apply dark mode preference
    if (typeof localStorage !== 'undefined' && localStorage.getItem('scribe-theme') === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
    });

    this.noteService.getFolders().subscribe(f => {
      this.folders.set(f);
    });

    this.idbService.getAllNotes().then(notes => {
      this.notes.set(notes.filter(n => !n.isDeleted));
    });

    this.idbService.getAllThoughts().then(thoughts => {
      this.thoughts.set(thoughts);
    });
  }

  ngOnDestroy(): void {}

  getWordCount(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  openNewThoughtSheet(): void {
    this.editingThought.set({
      id: '',
      text: '',
      createdAt: 0
    });
    this.thoughtEditText.set('');
    this.isEditingThoughtMode.set(true);
  }

  openThoughtEdit(thought: QuickThought): void {
    this.editingThought.set(thought);
    this.thoughtEditText.set(thought.text);
    this.isEditingThoughtMode.set(false);
  }

  saveThoughtEdit(): void {
    const t = this.editingThought();
    const text = this.thoughtEditText().trim();
    if (!t || !text) return;

    if (!t.id) {
      // Create new thought
      const newThought: QuickThought = {
        id: uuidv4(),
        text,
        createdAt: Date.now()
      };
      this.idbService.putThought(newThought).then(() => {
        this.editingThought.set(null);
        this.idbService.getAllThoughts().then(list => this.thoughts.set(list));
      });
    } else {
      // Update existing thought
      const updated: QuickThought = {
        ...t,
        text
      };
      this.idbService.putThought(updated).then(() => {
        this.editingThought.set(null);
        this.idbService.getAllThoughts().then(list => this.thoughts.set(list));
      });
    }
  }

  deleteThought(id: string): void {
    if (!id) return;
    this.idbService.deleteThought(id).then(() => {
      this.editingThought.set(null);
      this.idbService.getAllThoughts().then(list => this.thoughts.set(list));
    });
  }

  getPreview(html: string): string {
    if (!html) return 'No content';
    const text = html.replace(/<[^>]*>?/gm, ' ');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  getReadingTime(html: string): number {
    const text = html.replace(/<[^>]*>?/gm, ' ');
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  openNote(id: string): void {
    this.router.navigate(['/library/read', id]);
  }

  setSortOrder(order: SortOrder): void {
    this.sortOrder.set(order);
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
  }

  selectFolder(folderId: string | null): void {
    this.filterFolderId.set(this.filterFolderId() === folderId ? null : folderId);
  }

  // Phase 4: Search highlighting
  highlight(text: string, query: string): SafeHtml {
    if (!query || !text) return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(text));
    const escaped = this.escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlighted = escaped.replace(
      new RegExp(`(${escapedQuery})`, 'gi'),
      '<mark>$1</mark>'
    );
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Phase 4: Recent searches
  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (query.trim()) {
      this.pushRecentSearch(query.trim());
      this.showRecentSearches.set(false);
    }
  }

  onSearchFocus(): void {
    this.showRecentSearches.set(true);
  }

  onSearchBlur(): void {
    // Delay to allow click on recent item
    setTimeout(() => this.showRecentSearches.set(false), 200);
  }

  useRecentSearch(term: string): void {
    this.searchQuery.set(term);
    this.showRecentSearches.set(false);
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('scribe-recent-searches');
    }
  }

  private pushRecentSearch(term: string): void {
    const current = this.recentSearches().filter(t => t !== term);
    const updated = [term, ...current].slice(0, 5);
    this.recentSearches.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('scribe-recent-searches', JSON.stringify(updated));
    }
  }

  private loadRecentSearches(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('scribe-recent-searches') || '[]');
    } catch {
      return [];
    }
  }
}
