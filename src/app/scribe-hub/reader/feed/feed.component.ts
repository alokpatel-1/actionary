import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface ReaderNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

@Component({
  selector: 'app-reader-feed',
  standalone: false,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent {
  publishedNotes = signal<ReaderNote[]>([
    { id: '1', title: 'System Architecture Overview', content: 'Notes on MEAN stack modular architecture and data structures...', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000 },
    { id: '3', title: 'TypeScript 5.4 Best Practices', content: 'Comprehensive guide to advanced TypeScript utility types and signals...', tags: ['typescript', 'frontend'], createdAt: Date.now() - 172800000 }
  ]);
  searchQuery = signal('');
  selectedTag = signal<string | null>(null);

  allTags = computed(() => {
    const set = new Set<string>();
    this.publishedNotes().forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  });

  filteredNotes = computed(() => {
    let list = this.publishedNotes();
    const tag = this.selectedTag();
    if (tag) {
      list = list.filter(n => (n.tags || []).includes(tag));
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  });

  constructor(private router: Router) {}

  openNote(id: string): void {
    this.router.navigate(['/new/reader/notes', id]);
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
  }
}
