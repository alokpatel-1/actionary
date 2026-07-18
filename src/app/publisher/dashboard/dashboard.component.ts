import { Component, signal, computed, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';

export interface PublisherNote {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  tags: string[];
  createdAt: number;
}

export interface ConfirmDialogConfig {
  isOpen: boolean;
  type: 'delete' | 'publish' | 'unpublish';
  noteId: string | null;
  noteTitle: string;
}

@Component({
  selector: 'app-publisher-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  public sidebarService = inject(SidebarService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  notes = signal<PublisherNote[]>([
    { id: '1', title: 'System Architecture Overview', content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps.', status: 'published', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000 },
    { id: '2', title: 'Draft Release Notes v2.0', content: 'Upcoming features: Reader Module, Publisher Workspace, and Auth Profile...', status: 'draft', tags: ['release', 'notes'], createdAt: Date.now() - 3600000 },
    { id: '3', title: 'Building Reactive State with Angular Signals', content: 'Learn how computed signals, effects, and writable signals eliminate zone.js overhead and streamline Angular state management.', status: 'published', tags: ['angular', 'frontend'], createdAt: Date.now() - 259200000 },
    { id: '4', title: 'RxJS Operators Draft Guide', content: 'Draft outlining switchMap vs mergeMap vs concatMap performance comparisons and marble diagram visualizers.', status: 'draft', tags: ['rxjs', 'draft'], createdAt: Date.now() - 7200000 },
    { id: '5', title: 'MongoDB Indexing & Performance Optimization', content: 'Strategies for compound indexes, partial indexes, explain plans, and aggregation pipeline optimizations for high-throughput databases.', status: 'published', tags: ['database', 'mean'], createdAt: Date.now() - 432000000 },
    { id: '6', title: 'Draft Design Specs for Dark Mode', content: 'Color token tokens, HSL adjustments, card glassmorphism overlays, and accessibility contrast standards.', status: 'draft', tags: ['design', 'draft'], createdAt: Date.now() - 10800000 },
    { id: '7', title: 'OAuth2 & JWT Security Best Practices', content: 'Securing web applications using short-lived JWT access tokens, HttpOnly refresh cookies, and PKCE flow authentication.', status: 'published', tags: ['security', 'architecture'], createdAt: Date.now() - 604800000 },
    { id: '8', title: 'GraphQL Resolver Caching Notes', content: 'Draft notes on dataloader batching, redis cache layers, and field-level caching in GraphQL resolvers.', status: 'draft', tags: ['graphql', 'backend'], createdAt: Date.now() - 14400000 },
    { id: '9', title: 'Docker Containerization Strategy', content: 'Creating multi-stage Docker builds, minimizing image sizes, orchestrating development environments with docker-compose.', status: 'published', tags: ['docker', 'cloud'], createdAt: Date.now() - 777600000 },
    { id: '10', title: 'Web Vitals & Front-End Performance', content: 'Optimizing LCP, CLS, and INP metrics using image compression, font preloading, and dynamic code splitting.', status: 'published', tags: ['performance', 'frontend'], createdAt: Date.now() - 864000000 },
    { id: '11', title: 'Unit & Integration Testing Strategy', content: 'Draft outline of unit test coverage thresholds, E2E test suites with Cypress, and CI integration pipelines.', status: 'draft', tags: ['testing', 'ci'], createdAt: Date.now() - 18000000 },
    { id: '12', title: 'Microservices & Event-Driven Systems', content: 'Designing decoupled event-driven architectures with Kafka event streams, saga orchestration patterns, and distributed logging.', status: 'published', tags: ['architecture', 'cloud'], createdAt: Date.now() - 1036800000 },
    { id: '13', title: 'CSS Grid & Flexbox Modern Layouts', content: 'Draft snippet collection for subgrid, fluid clamp typography, container queries, and CSS custom properties.', status: 'draft', tags: ['css', 'frontend'], createdAt: Date.now() - 21600000 },
    { id: '14', title: 'AI & LLM Integration Patterns', content: 'Embedding OpenAI & Gemini LLM agent APIs, vector databases, RAG search pipelines, and streaming response UI widgets.', status: 'published', tags: ['ai', 'architecture'], createdAt: Date.now() - 1209600000 },
    { id: '15', title: 'Node.js Event Loop Mechanics', content: 'Detailed reference on microtask queue processing, process.nextTick priority execution, and I/O event loops.', status: 'published', tags: ['mean', 'backend'], createdAt: Date.now() - 1296000000 }
  ]);

  activeTab = signal<'draft' | 'published'>('draft');
  searchQuery = signal('');
  selectedTag = signal<string | null>(null);
  showTagPanel = signal(false);
  viewMode = signal<'card' | 'list'>('card');

  draftCount = computed(() => this.notes().filter(n => n.status === 'draft').length);
  publishedCount = computed(() => this.notes().filter(n => n.status === 'published').length);

  allTags = computed(() => {
    const set = new Set<string>();
    this.notes().forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  });

  // Unified Confirmation Dialog State
  confirmDialog = signal<ConfirmDialogConfig>({
    isOpen: false,
    type: 'delete',
    noteId: null,
    noteTitle: ''
  });

  dialogTitle = computed(() => {
    const type = this.confirmDialog().type;
    if (type === 'publish') return 'Publish Note';
    if (type === 'unpublish') return 'Unpublish Note';
    return 'Delete Note';
  });

  dialogMessage = computed(() => {
    const { type, noteTitle } = this.confirmDialog();
    const title = noteTitle || 'this note';
    if (type === 'publish') return `Are you sure you want to publish "${title}"? It will become visible to all readers on the Home feed.`;
    if (type === 'unpublish') return `Are you sure you want to unpublish "${title}"? It will be moved back to your Draft notes.`;
    return `Are you sure you want to delete "${title}"? This action cannot be undone.`;
  });

  dialogConfirmText = computed(() => {
    const type = this.confirmDialog().type;
    if (type === 'publish') return 'Publish Note';
    if (type === 'unpublish') return 'Unpublish Note';
    return 'Delete Note';
  });

  filteredNotes = computed(() => {
    let list = this.notes().filter(n => n.status === this.activeTab());
    const tag = this.selectedTag();
    if (tag) {
      list = list.filter(n => (n.tags || []).includes(tag));
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  });

  constructor(private router: Router) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement?.focus();
    }
  }

  createNewNote(): void {
    this.router.navigate(['/new/publisher/editor', 'new']);
  }

  editNote(id: string): void {
    this.router.navigate(['/new/publisher/editor', id]);
  }

  publishNote(id: string, event: Event): void {
    event.stopPropagation();
    const targetNote = this.notes().find(n => n.id === id);
    this.confirmDialog.set({
      isOpen: true,
      type: 'publish',
      noteId: id,
      noteTitle: targetNote?.title || 'this note'
    });
  }

  unpublishNote(id: string, event: Event): void {
    event.stopPropagation();
    const targetNote = this.notes().find(n => n.id === id);
    this.confirmDialog.set({
      isOpen: true,
      type: 'unpublish',
      noteId: id,
      noteTitle: targetNote?.title || 'this note'
    });
  }

  deleteNote(id: string, event: Event): void {
    event.stopPropagation();
    const targetNote = this.notes().find(n => n.id === id);
    this.confirmDialog.set({
      isOpen: true,
      type: 'delete',
      noteId: id,
      noteTitle: targetNote?.title || 'this note'
    });
  }

  handleConfirmAction(): void {
    const { type, noteId } = this.confirmDialog();
    if (!noteId) return;

    if (type === 'delete') {
      this.notes.set(this.notes().filter(n => n.id !== noteId));
    } else if (type === 'publish') {
      this.notes.update(list => list.map(n => n.id === noteId ? { ...n, status: 'published' } : n));
    } else if (type === 'unpublish') {
      this.notes.update(list => list.map(n => n.id === noteId ? { ...n, status: 'draft' } : n));
    }

    this.cancelConfirmDialog();
  }

  cancelConfirmDialog(): void {
    this.confirmDialog.set({
      isOpen: false,
      type: 'delete',
      noteId: null,
      noteTitle: ''
    });
  }

  toggleTagPanel(): void {
    this.showTagPanel.update(v => !v);
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
    this.showTagPanel.set(false);
  }

  closeTagPanel(): void {
    this.showTagPanel.set(false);
  }
}
