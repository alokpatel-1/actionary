import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReaderNote } from '../feed/feed.component';
import { SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-reader-trending',
  standalone: false,
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss'
})
export class TrendingComponent {
  public sidebarService = inject(SidebarService);

  trendingNotes = signal<ReaderNote[]>([
    { id: '1', title: 'System Architecture Overview', content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps.', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000 },
    { id: '2', title: 'TypeScript 5.4 Advanced Features', content: 'Comprehensive guide exploring narrowing in closure functions, NoInfer utility type, Object.groupBy helper, and reactive signal workflows.', tags: ['typescript', 'frontend'], createdAt: Date.now() - 172800000 },
    { id: '3', title: 'Building Reactive State with Angular Signals', content: 'Learn how computed signals, effects, and writable signals eliminate zone.js overhead and streamline Angular state management.', tags: ['angular', 'frontend'], createdAt: Date.now() - 259200000 },
    { id: '4', title: 'RxJS Operators Mastery Guide', content: 'Master switchMap, mergeMap, concatMap, and exhaustMap with real-world async data flow streams and error handling patterns.', tags: ['rxjs', 'frontend'], createdAt: Date.now() - 345600000 },
    { id: '5', title: 'MongoDB Indexing & Performance Optimization', content: 'Strategies for compound indexes, partial indexes, explain plans, and aggregation pipeline optimizations for high-throughput databases.', tags: ['database', 'mean'], createdAt: Date.now() - 432000000 },
    { id: '6', title: 'Glassmorphism & Modern UI Design Systems', content: 'Designing sleek dark mode interfaces, translucent blur backdrops, vibrant gradient accents, and dynamic CSS micro-animations.', tags: ['design', 'frontend'], createdAt: Date.now() - 518400000 },
    { id: '7', title: 'OAuth2 & JWT Security Best Practices', content: 'Securing web applications using short-lived JWT access tokens, HttpOnly refresh cookies, and PKCE flow authentication.', tags: ['security', 'architecture'], createdAt: Date.now() - 604800000 },
    { id: '8', title: 'GraphQL vs REST API Architecture', content: 'Comparing schema design, query resolvers, N+1 problem mitigation, caching, and over-fetching tradeoffs in modern API development.', tags: ['graphql', 'architecture'], createdAt: Date.now() - 691200000 },
    { id: '9', title: 'Docker Containerization Strategy', content: 'Creating multi-stage Docker builds, minimizing image sizes, orchestrating development environments with docker-compose.', tags: ['docker', 'cloud'], createdAt: Date.now() - 777600000 },
    { id: '10', title: 'Web Vitals & Front-End Performance', content: 'Optimizing LCP, CLS, and INP metrics using image compression, font preloading, and dynamic code splitting.', tags: ['performance', 'frontend'], createdAt: Date.now() - 864000000 },
    { id: '11', title: 'Unit & Integration Testing in Angular', content: 'Writing clean component tests, mocking services with Jasmine and Jest, and automated end-to-end user journey validation.', tags: ['testing', 'angular'], createdAt: Date.now() - 950400000 },
    { id: '12', title: 'Microservices & Event-Driven Systems', content: 'Designing decoupled event-driven architectures with Kafka event streams, saga orchestration patterns, and distributed logging.', tags: ['architecture', 'cloud'], createdAt: Date.now() - 1036800000 },
    { id: '13', title: 'CSS Grid & Flexbox Responsive Patterns', content: 'Mastering modern layout techniques, dynamic subgrid, container queries, and fluid typography for responsive web design.', tags: ['design', 'frontend'], createdAt: Date.now() - 1123200000 },
    { id: '14', title: 'AI & LLM Integration in Web Apps', content: 'Embedding OpenAI & Gemini LLM agent APIs, vector databases, RAG search pipelines, and streaming response UI widgets.', tags: ['ai', 'architecture'], createdAt: Date.now() - 1209600000 },
    { id: '15', title: 'Node.js Event Loop & Asynchronous I/O', content: 'Understanding microtask queues, process.nextTick, libuv thread pool, and non-blocking I/O execution mechanics in Node.js.', tags: ['mean', 'backend'], createdAt: Date.now() - 1296000000 }
  ]);

  constructor(private router: Router) {}

  openNote(id: string): void {
    this.router.navigate(['/reader/notes', id]);
  }
}
