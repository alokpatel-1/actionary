import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface PublisherNote {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  tags: string[];
  createdAt: number;
}

@Component({
  selector: 'app-publisher-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  notes = signal<PublisherNote[]>([
    { id: '1', title: 'System Architecture Overview', content: 'Notes on MEAN stack modular architecture and data structures...', status: 'published', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000 },
    { id: '2', title: 'Draft Release Notes v2.0', content: 'Upcoming features: Reader Module, Publisher Workspace, and Auth Profile...', status: 'draft', tags: ['release', 'notes'], createdAt: Date.now() - 3600000 }
  ]);
  activeFilter = signal<'all' | 'drafts' | 'published'>('all');
  searchQuery = signal('');

  filteredNotes = computed(() => {
    let list = this.notes();
    const f = this.activeFilter();
    if (f === 'drafts') {
      list = list.filter(n => n.status === 'draft');
    } else if (f === 'published') {
      list = list.filter(n => n.status === 'published');
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  });

  constructor(private router: Router) {}

  createNewNote(): void {
    this.router.navigate(['/new/publisher/editor', 'new']);
  }

  editNote(id: string): void {
    this.router.navigate(['/new/publisher/editor', id]);
  }

  deleteNote(id: string, event: Event): void {
    event.stopPropagation();
    this.notes.set(this.notes().filter(n => n.id !== id));
  }
}
