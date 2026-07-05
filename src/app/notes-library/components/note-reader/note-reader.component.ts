import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteIdbService } from '../../../study-notes/services/note-idb.service';
import { NoteService } from '../../../study-notes/services/note.service';
import { Note, NoteFolder, NoteComment } from '../../../study-notes/models/note.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { v4 as uuidv4 } from 'uuid';

export interface ReaderBlock {
  index: number;
  safeHtml: SafeHtml;
  rawHtml: string;
}

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
  private noteService = inject(NoteService);
  private sanitizer = inject(DomSanitizer);

  note = signal<Note | null>(null);
  folder = signal<NoteFolder | null>(null);
  safeContent = signal<SafeHtml>('');
  readingTime = signal(1);

  // Line comments features
  blocks = signal<ReaderBlock[]>([]);
  activeBlockIndex = signal<number | null>(null);
  showCommentDrawer = signal(false);
  newCommentText = signal('');

  commentsForActiveBlock = computed(() => {
    const idx = this.activeBlockIndex();
    if (idx === null) return [];
    return (this.note()?.comments || []).filter(c => c.blockIndex === idx);
  });

  // Highlight features
  showHighlightMenu = signal(false);
  highlightMenuX = signal(0);
  highlightMenuY = signal(0);
  selectedRange: Range | null = null;

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
          this.blocks.set(this.parseBlocks(processedHtml));
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

  parseBlocks(html: string): ReaderBlock[] {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const children = Array.from(doc.body.children);
    return children.map((el, index) => {
      return {
        index,
        safeHtml: this.sanitizer.bypassSecurityTrustHtml(el.outerHTML),
        rawHtml: el.outerHTML
      };
    });
  }

  openComments(index: number): void {
    this.activeBlockIndex.set(index);
    this.showCommentDrawer.set(true);
  }

  getCommentCount(index: number): number {
    return (this.note()?.comments || []).filter(c => c.blockIndex === index).length;
  }

  addComment(): void {
    const text = this.newCommentText().trim();
    const idx = this.activeBlockIndex();
    const n = this.note();
    if (!text || idx === null || !n) return;

    let currentUser = 'Guest';
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        currentUser = u.displayName || u.email || 'Member';
      }
    } catch (e) {}

    const newComment: NoteComment = {
      id: uuidv4(),
      blockIndex: idx,
      text,
      userName: currentUser,
      createdAt: Date.now()
    };

    const updatedComments = [...(n.comments || []), newComment];
    this.noteService.updateNote(n.id, { comments: updatedComments }).subscribe(updatedNote => {
      this.note.set(updatedNote);
      this.newCommentText.set('');
    });
  }

  deleteComment(commentId: string): void {
    const n = this.note();
    if (!n || !n.comments) return;
    const updatedComments = n.comments.filter(c => c.id !== commentId);
    this.noteService.updateNote(n.id, { comments: updatedComments }).subscribe(updatedNote => {
      this.note.set(updatedNote);
    });
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTimeout(() => {
        if (!this.isClickInsideHighlightMenu(event)) {
          this.showHighlightMenu.set(false);
          this.selectedRange = null;
        }
      }, 100);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.querySelector('.reader-article');
    if (container && container.contains(range.commonAncestorContainer)) {
      const text = range.toString().trim();
      if (text.length > 0) {
        this.selectedRange = range;
        
        const rect = range.getBoundingClientRect();
        this.highlightMenuX.set(rect.left + rect.width / 2 + window.scrollX);
        this.highlightMenuY.set(rect.top - 45 + window.scrollY);
        this.showHighlightMenu.set(true);
      }
    }
  }

  private isClickInsideHighlightMenu(event: MouseEvent): boolean {
    const el = document.querySelector('.highlight-toolbar');
    return el ? el.contains(event.target as Node) : false;
  }

  applyHighlight(color: string): void {
    const range = this.selectedRange;
    const n = this.note();
    if (!range || !n) return;

    const mark = document.createElement('mark');
    mark.className = `hl-${color}`;
    
    try {
      range.surroundContents(mark);
    } catch (e) {
      const content = range.extractContents();
      mark.appendChild(content);
      range.insertNode(mark);
    }

    const blockEls = document.querySelectorAll('.reader-block-content > *');
    const updatedBlocksHtml: string[] = [];
    blockEls.forEach(el => {
      updatedBlocksHtml.push(el.outerHTML);
    });
    
    const newContent = updatedBlocksHtml.join('\n');
    
    this.noteService.updateNote(n.id, { content: newContent }).subscribe(updatedNote => {
      this.note.set(updatedNote);
      const processedHtml = this.injectTocIds(newContent);
      this.blocks.set(this.parseBlocks(processedHtml));
      this.showHighlightMenu.set(false);
      this.selectedRange = null;
      window.getSelection()?.removeAllRanges();
    });
  }

  clearHighlight(): void {
    const range = this.selectedRange;
    const n = this.note();
    if (!range || !n) return;

    const fragment = range.cloneContents();
    const marks = fragment.querySelectorAll('mark');
    if (marks.length > 0) {
      const textNode = document.createTextNode(range.toString());
      range.deleteContents();
      range.insertNode(textNode);
    } else {
      let parent: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }
      if (parent && parent.tagName === 'MARK') {
        const text = parent.innerText;
        const textNode = document.createTextNode(text);
        parent.replaceWith(textNode);
      }
    }

    const blockEls = document.querySelectorAll('.reader-block-content > *');
    const updatedBlocksHtml: string[] = [];
    blockEls.forEach(el => {
      updatedBlocksHtml.push(el.outerHTML);
    });
    
    const newContent = updatedBlocksHtml.join('\n');
    this.noteService.updateNote(n.id, { content: newContent }).subscribe(updatedNote => {
      this.note.set(updatedNote);
      const processedHtml = this.injectTocIds(newContent);
      this.blocks.set(this.parseBlocks(processedHtml));
      this.showHighlightMenu.set(false);
      this.selectedRange = null;
      window.getSelection()?.removeAllRanges();
    });
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
