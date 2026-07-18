import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, signal, computed, effect, HostListener, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { Note, NoteFolder, DEFAULT_FOLDER } from '../../models/note.model';
import { Subject, debounceTime, takeUntil, switchMap, of, map, tap } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { NOTE_TEMPLATES, NoteTemplate } from './note-templates';

import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlock } from '@tiptap/extension-code-block';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('custom-code-block');

      const btn = document.createElement('button');
      btn.classList.add('copy-code-btn');
      btn.innerHTML = '<i class="pi pi-copy"></i>';
      btn.title = 'Copy code';
      
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(node.textContent);
        btn.innerHTML = '<i class="pi pi-check" style="color: #4ade80;"></i>';
        setTimeout(() => {
          btn.innerHTML = '<i class="pi pi-copy"></i>';
        }, 2000);
      });

      const pre = document.createElement('pre');
      const code = document.createElement('code');

      pre.appendChild(code);
      wrapper.appendChild(btn);
      wrapper.appendChild(pre);

      return {
        dom: wrapper,
        contentDOM: code,
      };
    };
  }
});

import { SlashCommands } from './slash-commands';
import { StudyNotesComponent } from '../../study-notes.component';

@Component({
  selector: 'app-note-editor',
  standalone: false,
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss'
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editorStatus', { static: true }) editorStatusTpl!: TemplateRef<any>;
  @ViewChild('editorActions', { static: true }) editorActionsTpl!: TemplateRef<any>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public noteService = inject(NoteService);
  public studyNotes = inject(StudyNotesComponent, { optional: true });
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();
  private editorInitGen = 0;
  private noteSession = 0;
  private autoSaveSession = 0;

  noteId = signal<string | null>(null);
  title = signal('');
  content = signal('');
  folderId = signal(DEFAULT_FOLDER.id);
  isPinned = signal(false);
  folders = signal<NoteFolder[]>([]);
  saving = signal(false);
  isNew = signal(true);
  isEditMode = signal(false);
  isLayoutReady = false;
  lastSaved = signal<number | null>(null);

  // Word / char count
  wordCount = signal(0);
  charCount = signal(0);
  readingTime = computed(() => Math.max(1, Math.ceil(this.wordCount() / 200)));


  // Templates
  readonly templates = NOTE_TEMPLATES;
  showTemplates = computed(() => this.isNew() && this.isEditMode() && !this.content());

  // Tags
  tags = signal<string[]>([]);
  tagInput = signal('');
  allExistingTags = signal<string[]>([]);
  tagInputFocused = signal(false);
  matchingTags = computed(() => {
    const query = this.tagInput().trim().toLowerCase();
    const existing = this.allExistingTags();
    const currentTags = this.tags();
    
    if (!query) {
      return existing.filter(tag => !currentTags.includes(tag));
    }
    
    return existing.filter(tag =>
      tag.includes(query) && !currentTags.includes(tag)
    );
  });

  // Status
  status = signal<'draft' | 'published'>('draft');

  // Version history
  showVersionPanel = signal(false);
  versions = signal<{ content: string; savedAt: number }[]>([]);

  editor!: Editor;

  readonly textColors: { label: string; color: string | null }[] = [
    { label: 'Default', color: null },
    { label: 'Black', color: '#111827' },
    { label: 'Gray', color: '#6b7280' },
    { label: 'Red', color: '#dc2626' },
    { label: 'Orange', color: '#ea580c' },
    { label: 'Amber', color: '#d97706' },
    { label: 'Yellow', color: '#ca8a04' },
    { label: 'Green', color: '#16a34a' },
    { label: 'Teal', color: '#0d9488' },
    { label: 'Blue', color: '#2563eb' },
    { label: 'Indigo', color: '#4f46e5' },
    { label: 'Purple', color: '#9333ea' },
    { label: 'Pink', color: '#db2777' },
    { label: 'Rose', color: '#e11d48' },
  ];

  constructor() {
    effect(() => {
      const activeFid = this.noteService.activeFolderId();
      if (this.isNew()) {
        this.folderId.set(activeFid || DEFAULT_FOLDER.id);
      }
    });
  }


  applyTemplate(template: NoteTemplate): void {
    if (!this.editor) return;
    this.editor.commands.setContent(template.content);
    this.content.set(template.content);
    this.updateWordCount();
    setTimeout(() => this.editor.commands.focus('end'), 50);
  }

  addTag(): void {
    const tag = this.tagInput().trim().toLowerCase();
    if (!tag) return;
    const current = this.tags();
    if (!current.includes(tag)) {
      this.tags.set([...current, tag]);
    }
    this.tagInput.set('');
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  addTagFromSuggestion(tag: string): void {
    const current = this.tags();
    if (!current.includes(tag)) {
      this.tags.set([...current, tag]);
    }
    this.tagInput.set('');
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  removeTag(tag: string): void {
    this.tags.set(this.tags().filter(t => t !== tag));
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  onTagFocus(): void {
    this.tagInputFocused.set(true);
  }

  onTagBlur(): void {
    setTimeout(() => {
      this.tagInputFocused.set(false);
    }, 150);
  }

  toggleStatus(): void {
    this.status.set(this.status() === 'draft' ? 'published' : 'draft');
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  openVersionPanel(): void {
    // Load versions from current note
    const noteId = this.noteId();
    if (!noteId) return;
    this.noteService.getNote(noteId).pipe(
      (obs) => obs
    ).subscribe(note => {
      if (note) {
        this.versions.set(note.versions || []);
        this.showVersionPanel.set(true);
      }
    });
  }

  restoreVersion(version: { content: string; savedAt: number }): void {
    if (!this.editor) return;
    this.editor.commands.setContent(version.content);
    this.content.set(version.content);
    this.showVersionPanel.set(false);
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  private updateWordCount(): void {
    if (!this.editor) return;
    const text = this.editor.getText();
    const trimmed = text.trim();
    this.charCount.set(trimmed.length);
    this.wordCount.set(trimmed ? trimmed.split(/\s+/).length : 0);
  }

  ngOnInit(): void {
    this.noteService.getFolders().subscribe(f => this.folders.set(f));

    this.noteService.getAllNotes().subscribe(notes => {
      const tagsSet = new Set<string>();
      notes.forEach(note => (note.tags || []).forEach(t => {
        const trimmed = t.trim().toLowerCase();
        if (trimmed) tagsSet.add(trimmed);
      }));
      this.allExistingTags.set(Array.from(tagsSet).sort());
    });

    this.route.paramMap.pipe(
      tap(() => {
        if (this.noteSession > 0) {
          this.saveBeforeLeave();
        }
        this.noteSession++;
      }),
      switchMap(params => {
        const id = params.get('id');
        if (id && id !== 'new') {
          const editQuery = this.route.snapshot.queryParamMap.get('edit');
          const isPublisherRoute = this.router.url.includes('/publisher/') || this.router.url.includes('/new/');
          const shouldEdit = isPublisherRoute || editQuery === 'true' || editQuery !== 'false';

          return this.noteService.getNote(id).pipe(
            map(note => ({
              id,
              note,
              edit: shouldEdit
            }))
          );
        }
        return of({ id: null as string | null, note: undefined as Note | undefined, edit: true });
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => this.applyLoadedNote(data));

    this.autoSave$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.autoSaveSession === this.noteSession) {
        this.save();
      }
    });
  }

  ngAfterViewInit() {
    this.studyNotes?.editorStatusTemplate.set(this.editorStatusTpl);
    this.studyNotes?.editorActionsTemplate.set(this.editorActionsTpl);
    this.cdr.detectChanges();
  }

  private loadedNoteSnapshot: {
    title: string;
    content: string;
    folderId: string;
    isPinned: boolean;
    tags: string[];
    status: string;
  } | null = null;

  private updateSnapshotAfterSave(): void {
    this.loadedNoteSnapshot = {
      title: (this.title() || '').trim(),
      content: (this.content() || '').trim(),
      folderId: this.folderId() || DEFAULT_FOLDER.id,
      isPinned: !!this.isPinned(),
      tags: (this.tags() || []).slice(),
      status: this.status() || 'draft'
    };
  }

  private hasContentChanged(): boolean {
    if (this.isNew()) return true;
    if (!this.loadedNoteSnapshot) return false;

    const snapshot = this.loadedNoteSnapshot;
    const currentTitle = (this.title() || '').trim();
    if (currentTitle !== snapshot.title) return true;

    const currentContent = (this.content() || '').trim();
    if (currentContent !== snapshot.content) return true;

    if (this.folderId() !== snapshot.folderId) return true;
    if (this.isPinned() !== snapshot.isPinned) return true;
    if (this.status() !== snapshot.status) return true;

    const currentTags = (this.tags() || []).map(t => t.trim()).sort().join(',');
    const snapshotTags = (snapshot.tags || []).map(t => t.trim()).sort().join(',');
    if (currentTags !== snapshotTags) return true;

    return false;
  }

  private saveBeforeLeave(): void {
    if (this.saving() || this.isNew() || !this.noteId()) return;

    this.syncContentFromEditor();
    if (this.isBlankNote()) return;
    if (!this.hasContentChanged()) return;

    const id = this.noteId()!;
    this.noteService.updateNote(id, {
      title: this.title() || 'Untitled Note',
      content: this.content(),
      folderId: this.folderId(),
      isPinned: this.isPinned()
    }).subscribe({
      next: () => {
        this.updateSnapshotAfterSave();
      }
    });
  }

  private applyLoadedNote(data: {
    id: string | null;
    note: Note | undefined;
    edit: boolean;
  }): void {
    this.saving.set(false);
    this.lastSaved.set(null);

    const { id, note, edit } = data;
    if (id) {
      this.isNew.set(false);
      this.isEditMode.set(edit);
      this.noteId.set(id);
      if (note) {
        this.title.set(note.title || '');
        this.content.set(note.content || '');
        this.folderId.set(note.folderId || DEFAULT_FOLDER.id);
        this.isPinned.set(!!note.isPinned);
        this.tags.set(note.tags || []);
        this.status.set(note.status || 'draft');
        this.updateSnapshotAfterSave();
      } else {
        this.title.set('');
        this.content.set('');
        this.folderId.set(DEFAULT_FOLDER.id);
        this.isPinned.set(false);
        this.tags.set([]);
        this.status.set('draft');
        this.loadedNoteSnapshot = null;
      }
      this.isLayoutReady = false;
      this.cdr.detectChanges();
      this.initEditor();
      this.scrollToTop();
    } else {
      this.isNew.set(true);
      this.isEditMode.set(true);
      this.noteId.set(null);
      this.title.set('');
      this.content.set('');
      const activeFid = this.noteService.activeFolderId();
      this.folderId.set(activeFid || DEFAULT_FOLDER.id);
      this.isPinned.set(false);
      this.tags.set([]);
      this.status.set('draft');
      this.loadedNoteSnapshot = null;
      this.cdr.detectChanges();
      this.initEditor();
      this.scrollToTop();
    }
  }

  private initEditor(): void {
    const gen = ++this.editorInitGen;

    if (this.editor) {
      this.editor.destroy();
      (this.editor as any) = null;
      this.isLayoutReady = false;
      this.cdr.detectChanges();
    }

    const content = this.content();
    const editable = this.isEditMode();

    setTimeout(() => {
      if (gen !== this.editorInitGen) return;

      this.editor = new Editor({
        editable,
        content,
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            codeBlock: false,
            link: false,
            underline: false,
          }),
          CustomCodeBlock,
          Underline,
          TextStyle,
          Color.configure({ types: ['textStyle'] }),
          Link.configure({ openOnClick: false }),
          Image,
          TiptapTable.configure({ resizable: true }),
          TableRow,
          TableCell,
          TableHeader,
          TaskList,
          TaskItem.configure({ nested: true }),
          Placeholder.configure({
            placeholder: 'Start writing...',
          }),
          SlashCommands
        ],
        onUpdate: ({ editor }) => {
          if (!this.isEditMode()) return;
          this.content.set(editor.getHTML());
          this.autoSaveSession = this.noteSession;
          this.autoSave$.next();
          this.updateWordCount();
        },
        onCreate: () => {
          this.updateWordCount();
        }
      });

      this.isLayoutReady = true;
      this.cdr.detectChanges();
    }, 0);
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }

  ngOnDestroy(): void {
    this.studyNotes?.editorStatusTemplate.set(null);
    this.studyNotes?.editorActionsTemplate.set(null);
    this.editorInitGen++;
    if (this.editor) {
      this.editor.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  onFolderChange(folderId: string): void {
    this.folderId.set(folderId);
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  onPinToggle(): void {
    this.isPinned.set(!this.isPinned());
    this.autoSaveSession = this.noteSession;
    this.autoSave$.next();
  }

  enableEditMode(): void {
    this.isEditMode.set(true);
    this.editor?.setEditable(true);
    setTimeout(() => this.editor?.commands.focus(), 0);
  }

  focusEditor(event: Event): void {
    if (!this.isEditMode() || !this.editor) return;
    
    // If the click is on the editor-area or content wrapper itself (and not inside the text), focus the end of the text
    const target = event.target as HTMLElement;
    if (target.classList.contains('editor-area') || target.classList.contains('tiptap-editor-wrapper')) {
      this.editor.commands.focus('end');
    }
  }

  setTextColor(color: string | null): void {
    if (!this.editor) return;
    if (!color) {
      this.removeTextColor();
      return;
    }
    this.editor.chain().focus().setColor(color).run();
  }

  isTextColorActive(color?: string | null): boolean {
    if (!this.editor) return false;
    const current = this.editor.getAttributes('textStyle')['color'] as string | undefined;
    if (color === null) {
      return !current;
    }
    if (color) {
      return current === color;
    }
    return !!current;
  }

  removeTextColor(): void {
    if (!this.editor) return;
    this.editor.chain().focus().unsetColor().unsetMark('textStyle').run();
  }

  /** Keep mousedown from clearing the text selection before color commands run. */
  keepEditorSelection(event: Event): void {
    event.preventDefault();
  }

  private syncContentFromEditor(): void {
    if (this.editor && !this.editor.isDestroyed) {
      this.content.set(this.editor.getHTML());
    }
  }

  private isBlankNote(): boolean {
    const titleVal = (this.title() || '').trim();
    const contentVal = (this.content() || '').trim();
    // Strip HTML tags to see if there is actual content text
    const textContent = contentVal.replace(/<[^>]*>?/gm, ' ').trim();

    const isTitleBlank = !titleVal || titleVal.toLowerCase() === 'untitled note';
    const isContentBlank = !textContent || textContent === 'no content';

    return isTitleBlank && isContentBlank;
  }

  save(manual = false): void {
    this.syncContentFromEditor();

    if (this.saving() && !manual) return;

    if (this.isBlankNote()) {
      this.saving.set(false);
      return;
    }

    const saveNoteId = this.noteId();
    const wasNew = this.isNew();

    this.saving.set(true);
    const data = {
      title: this.title() || 'Untitled Note',
      content: this.content(),
      folderId: this.folderId(),
      isPinned: this.isPinned(),
      tags: this.tags(),
      status: this.status()
    };

    const finishSave = () => {
      this.lastSaved.set(Date.now());
      this.saving.set(false);
      if (manual && this.isEditMode()) {
        this.isEditMode.set(false);
        this.editor?.setEditable(false);
      }
    };

    if (wasNew) {
      this.noteService.addNote(data as any).subscribe({
        next: note => {
          this.noteId.set(note.id);
          this.isNew.set(false);
          finishSave();
          this.noteSession++;
          this.router.navigate(['/notes', 'edit', note.id], { replaceUrl: true, queryParams: { edit: 'true' } });
        },
        error: (err) => {
          console.error('[Note Save]', err);
          this.saving.set(false);
        }
      });
    } else {
      if (!saveNoteId) {
        this.saving.set(false);
        return;
      }
      this.noteService.updateNote(saveNoteId, data as any).subscribe({
        next: () => {
          if (this.noteId() !== saveNoteId) return;
          finishSave();
        },
        error: (err) => {
          console.error('[Note Save]', err);
          this.saving.set(false);
        }
      });
    }
  }

  triggerManualSync(): void {
    if (this.noteService.syncService.syncStatus() !== 'started') {
      this.noteService.syncService.sync().subscribe();
    }
  }

  deleteNote(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this note?',
      header: 'Delete Note',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        if (this.isNew()) {
          this.router.navigate(['/notes']);
        } else {
          this.noteService.deleteNote(this.noteId()!).subscribe(() => {
            this.router.navigate(['/notes']);
          });
        }
      }
    });
  }

  goToReadMode(): void {
    if (this.isNew()) return;
    this.router.navigate(['/library/read', this.noteId()]);
  }
}
