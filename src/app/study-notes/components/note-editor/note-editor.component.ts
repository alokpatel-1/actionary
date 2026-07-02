import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { Note, NoteFolder, DEFAULT_FOLDER } from '../../models/note.model';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  type EditorConfig,
  ClassicEditor,
  Autoformat,
  AutoImage,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontSize,
  Heading,
  Highlight,
  HorizontalLine,
  ImageBlock,
  ImageInline,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  PasteFromOffice,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline
} from 'ckeditor5';

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

  public Editor = ClassicEditor;
  public editorConfig: EditorConfig = {};

  ngOnInit(): void {
    // Load folders
    this.noteService.getFolders().subscribe(f => this.folders.set(f));

    // Check if editing existing note
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        if (this.noteId() === id) {
          return;
        }
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
        this.folderId.set(DEFAULT_FOLDER.id);
        this.isPinned.set(false);
        this.isLayoutReady = false;
        this.cdr.detectChanges();
        this.initEditor();
      }
    });

    // Auto-save with 1.5s debounce
    this.autoSave$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.save());
  }

  private initEditor(): void {
    this.editorConfig = {
      licenseKey: 'GPL',
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          '|',
          'highlight',
          'fontSize',
          '|',
          'bulletedList',
          'numberedList',
          'todoList',
          '|',
          'outdent',
          'indent',
          '|',
          'blockQuote',
          'code',
          'codeBlock',
          'horizontalLine',
          '|',
          'link',
          'insertTable',
          'insertImage',
        ],
        shouldNotGroupWhenFull: false
      },
      plugins: [
        Autoformat,
        AutoImage,
        BlockQuote,
        Bold,
        Code,
        CodeBlock,
        Essentials,
        FontBackgroundColor,
        FontColor,
        FontSize,
        Heading,
        Highlight,
        HorizontalLine,
        ImageBlock,
        ImageInline,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        Indent,
        IndentBlock,
        Italic,
        Link,
        List,
        ListProperties,
        Paragraph,
        PasteFromOffice,
        Strikethrough,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TextTransformation,
        TodoList,
        Underline
      ],
      heading: {
        options: [
          { model: 'paragraph' as const, title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1' as const, view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2' as const, view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3' as const, view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4' as const, view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        ]
      },
      image: {
        toolbar: [
          'imageTextAlternative',
          '|',
          'imageStyle:inline',
          'imageStyle:wrapText',
          'imageStyle:breakText',
          '|',
          'resizeImage'
        ]
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
      },
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true
        }
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://'
      },
      placeholder: 'Start writing your notes here…',
      initialData: this.content()
    };

    this.isLayoutReady = true;
    this.cdr.detectChanges();
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.autoSave$.next();
  }

  onEditorChange({ editor }: any): void {
    this.content.set(editor.getData());
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
          this.saving.set(false);
          this.lastSaved.set(Date.now());
          if (manual) {
            this.isEditMode.set(false);
          }
          this.router.navigate(['/notes', 'edit', note.id], { replaceUrl: true });
        },
        error: err => {
          console.error('Error saving note:', err);
          this.saving.set(false);
        }
      });
    } else {
      this.noteService.updateNote(this.noteId()!, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.lastSaved.set(Date.now());
          if (manual) {
            this.isEditMode.set(false);
          }
        },
        error: err => {
          console.error('Error updating note:', err);
          this.saving.set(false);
        }
      });
    }
  }

  goBack(): void {
    this.save(true);
    this.router.navigate(['/notes', 'create']);
  }

  deleteNote(): void {
    if (this.noteId()) {
      this.noteService.deleteNote(this.noteId()!).subscribe({
        next: () => {
          this.router.navigate(['/notes', 'create']);
        },
        error: err => {
          console.error('Error deleting note:', err);
        }
      });
    } else {
      this.router.navigate(['/notes', 'create']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
