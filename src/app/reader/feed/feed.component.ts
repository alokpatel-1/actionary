import { Component, signal, computed, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';

import { ReaderNote } from '../../shared/models/note.model';

@Component({
  selector: 'app-reader-feed',
  standalone: false,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent {
  public sidebarService = inject(SidebarService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  publishedNotes = signal<ReaderNote[]>([
    { id: '1', title: 'System Architecture Overview', content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps.', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '2', title: 'TypeScript 5.4 Advanced Features', content: 'Comprehensive guide exploring narrowing in closure functions, NoInfer utility type, Object.groupBy helper, and reactive signal workflows.', tags: ['typescript', 'frontend'], createdAt: Date.now() - 172800000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '3', title: 'Building Reactive State with Angular Signals', content: 'Learn how computed signals, effects, and writable signals eliminate zone.js overhead and streamline Angular state management.', tags: ['angular', 'frontend'], createdAt: Date.now() - 259200000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '4', title: 'RxJS Operators Mastery Guide', content: 'Master switchMap, mergeMap, concatMap, and exhaustMap with real-world async data flow streams and error handling patterns.', tags: ['rxjs', 'frontend'], createdAt: Date.now() - 345600000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '5', title: 'MongoDB Indexing & Performance Optimization', content: 'Strategies for compound indexes, partial indexes, explain plans, and aggregation pipeline optimizations for high-throughput databases.', tags: ['database', 'mean'], createdAt: Date.now() - 432000000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '6', title: 'Glassmorphism & Modern UI Design Systems', content: 'Designing sleek dark mode interfaces, translucent blur backdrops, vibrant gradient accents, and dynamic CSS micro-animations.', tags: ['design', 'frontend'], createdAt: Date.now() - 518400000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '7', title: 'OAuth2 & JWT Security Best Practices', content: 'Securing web applications using short-lived JWT access tokens, HttpOnly refresh cookies, and PKCE flow authentication.', tags: ['security', 'architecture'], createdAt: Date.now() - 604800000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '8', title: 'GraphQL vs REST API Architecture', content: 'Comparing schema design, query resolvers, N+1 problem mitigation, caching, and over-fetching tradeoffs in modern API development.', tags: ['graphql', 'architecture'], createdAt: Date.now() - 691200000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '9', title: 'Docker Containerization Strategy', content: 'Creating multi-stage Docker builds, minimizing image sizes, orchestrating development environments with docker-compose.', tags: ['docker', 'cloud'], createdAt: Date.now() - 777600000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '10', title: 'Web Vitals & Front-End Performance', content: 'Optimizing LCP, CLS, and INP metrics using image compression, font preloading, and dynamic code splitting.', tags: ['performance', 'frontend'], createdAt: Date.now() - 864000000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '11', title: 'Unit & Integration Testing in Angular', content: 'Writing clean component tests, mocking services with Jasmine and Jest, and automated end-to-end user journey validation.', tags: ['testing', 'angular'], createdAt: Date.now() - 950400000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '12', title: 'Microservices & Event-Driven Systems', content: 'Designing decoupled event-driven architectures with Kafka event streams, saga orchestration patterns, and distributed logging.', tags: ['architecture', 'cloud'], createdAt: Date.now() - 1036800000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '13', title: 'CSS Grid & Flexbox Responsive Patterns', content: 'Mastering modern layout techniques, dynamic subgrid, container queries, and fluid typography for responsive web design.', tags: ['design', 'frontend'], createdAt: Date.now() - 1123200000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '14', title: 'AI & LLM Integration in Web Apps', content: 'Embedding OpenAI & Gemini LLM agent APIs, vector databases, RAG search pipelines, and streaming response UI widgets.', tags: ['ai', 'architecture'], createdAt: Date.now() - 1209600000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  },
    { id: '15', title: 'Node.js Event Loop & Asynchronous I/O', content: 'Understanding microtask queues, process.nextTick, libuv thread pool, and non-blocking I/O execution mechanics in Node.js.', tags: ['mean', 'backend'], createdAt: Date.now() - 1296000000, publisherId: 'pub_1', publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=alice'  }
  ]);

  searchQuery = signal('');
  selectedTag = signal<string | null>(null);
  showTagPanel = signal(false);
  viewMode = signal<'card' | 'list'>('card');

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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement?.focus();
    }
  }

  openNote(id: string): void {
    this.router.navigate(['/reader/notes', id]);
  }

  openPublisher(event: Event, publisherId: string | undefined): void {
    if (publisherId) {
      event.stopPropagation();
      this.router.navigate(['/reader/publisher', publisherId]);
    }
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
