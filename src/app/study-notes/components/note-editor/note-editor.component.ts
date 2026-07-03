import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { Note, NoteFolder, DEFAULT_FOLDER } from '../../models/note.model';
import { Subject, debounceTime, takeUntil } from 'rxjs';

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
import { SlashCommands } from './slash-commands';

@Component({
  selector: 'app-note-editor',
  standalone: false,
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss'
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();

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

  editor!: Editor;

  ngOnInit(): void {
    this.noteService.getFolders().subscribe(f => this.folders.set(f));

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        if (this.noteId() === id) return;
        this.isNew.set(false);
        this.isEditMode.set(false);
        this.noteId.set(id);
        this.noteService.getNote(id).subscribe(note => {
          if (note) {
            this.title.set(note.title);
            this.content.set(note.content);
            this.folderId.set(note.folderId);
            this.isPinned.set(note.isPinned);
          }
          this.isLayoutReady = false;
          this.cdr.detectChanges();
          this.initEditor();
        });
      } else {
        this.isNew.set(true);
        this.isEditMode.set(true);
        this.noteId.set(null);
        this.title.set('');
        this.content.set('');
        const activeFid = this.noteService.activeFolderId();
        this.folderId.set(activeFid || DEFAULT_FOLDER.id);
        this.isPinned.set(false);
        this.isLayoutReady = false;
        this.cdr.detectChanges();
        this.initEditor();
      }
    });

    this.autoSave$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.save());
  }

  private initEditor(): void {
    if (this.editor) {
      this.editor.destroy();
    }
    
    this.editor = new Editor({
      content: this.content(),
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
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
        this.content.set(editor.getHTML());
        this.autoSave$.next();
      }
    });

    this.isLayoutReady = true;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.autoSave$.next();
  }

  onFolderChange(folderId: string): void {
    this.folderId.set(folderId);
    this.autoSave$.next();
  }

  onPinToggle(): void {
    this.isPinned.set(!this.isPinned());
    this.autoSave$.next();
  }

  enableEditMode(): void {
    this.isLayoutReady = false;
    this.isEditMode.set(true);
    this.cdr.detectChanges();
    this.initEditor();
  }

  save(manual = false): void {
    this.saving.set(true);
    const data = {
      title: this.title() || 'Untitled Note',
      content: this.content(),
      folderId: this.folderId(),
      isPinned: this.isPinned()
    };

    if (this.isNew()) {
      this.noteService.addNote(data as any).subscribe({
        next: note => {
          this.noteId.set(note.id);
          this.isNew.set(false);
          this.lastSaved.set(Date.now());
          this.saving.set(false);
          if (manual && this.isEditMode()) {
            this.isEditMode.set(false);
          }
          this.router.navigate(['/notes', note.id], { replaceUrl: true });
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.noteService.updateNote(this.noteId()!, data as any).subscribe({
        next: () => {
          this.lastSaved.set(Date.now());
          this.saving.set(false);
          if (manual && this.isEditMode()) {
            this.isEditMode.set(false);
          }
        },
        error: () => this.saving.set(false)
      });
    }
  }

  deleteNote(): void {
    if (confirm('Are you sure you want to delete this note?')) {
      if (this.isNew()) {
        this.router.navigate(['/notes']);
      } else {
        this.noteService.deleteNote(this.noteId()!).subscribe(() => {
          this.router.navigate(['/notes']);
        });
      }
    }
  }
}
