import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteIdbService } from '../../../study-notes/services/note-idb.service';
import { Note, NoteFolder } from '../../../study-notes/models/note.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-note-reader',
  templateUrl: './note-reader.component.html',
  styleUrls: ['./note-reader.component.scss'],
  standalone: false
})
export class NoteReaderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private idbService = inject(NoteIdbService);
  private sanitizer = inject(DomSanitizer);

  note = signal<Note | null>(null);
  folder = signal<NoteFolder | null>(null);
  safeContent = signal<SafeHtml>('');
  readingTime = signal(1);

  // Reading progress
  scrollProgress = signal(0);
  minutesLeft = computed(() =>
    Math.max(0, Math.round(this.readingTime() * (1 - this.scrollProgress() / 100)))
  );
  showReadPosition = computed(() => this.scrollProgress() > 2);
  showBackToTop = computed(() => this.scrollProgress() > 15);

  // Table of Contents
  tocItems = signal<{ id: string; text: string; level: number }[]>([]);
  activeSection = signal('');

  // Focus mode
  focusMode = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    this.scrollProgress.set(Math.min(100, Math.max(0, progress)));

    // Update active TOC section
    const headings = document.querySelectorAll('.article-content h2, .article-content h3');
    let current = '';
    headings.forEach(heading => {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 120) {
        current = heading.id;
      }
    });
    if (current) this.activeSection.set(current);
  }

  ngOnInit(): void {
    // Apply dark mode if preference is dark
    if (typeof localStorage !== 'undefined' && localStorage.getItem('scribe-theme') === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }

    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.idbService.getNote(noteId).then(note => {
        if (note) {
          this.note.set(note);
          const processedHtml = this.injectTocIds(note.content || '');
          this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(processedHtml));
          this.calculateReadingTime(note.content);

          if (note.folderId && note.folderId !== '__no_folder__') {
            this.idbService.getFolder(note.folderId).then(folder => {
              if (folder) {
                this.folder.set(folder);
              }
            });
          }
        }
      });
    }
  }

  ngOnDestroy(): void {}

  private injectTocIds(html: string): string {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const tocItems: { id: string; text: string; level: number }[] = [];
    const usedIds = new Set<string>();

    headings.forEach(heading => {
      const text = heading.textContent?.trim() || '';
      let baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!baseId) baseId = 'section';
      let id = baseId;
      let counter = 1;
      while (usedIds.has(id)) { id = `${baseId}-${counter++}`; }
      usedIds.add(id);
      heading.id = id;
      tocItems.push({ id, text, level: parseInt(heading.tagName.charAt(1)) });
    });

    this.tocItems.set(tocItems);
    return doc.body.innerHTML;
  }

  private calculateReadingTime(html: string): void {
    if (!html) return;
    const text = html.replace(/<[^>]*>?/gm, ' ');
    const wordCount = text.trim().split(/\s+/).length;
    this.readingTime.set(Math.max(1, Math.ceil(wordCount / 200)));
  }

  onSearchChange(query: string): void {
    if (query) {
      this.router.navigate(['/library'], { queryParams: { q: query } });
    }
  }

  editNote(): void {
    const n = this.note();
    if (n) {
      this.router.navigate(['/notes/edit', n.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/library']);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFocusMode(): void {
    this.focusMode.update(v => !v);
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  printNote(): void {
    window.print();
  }
}
