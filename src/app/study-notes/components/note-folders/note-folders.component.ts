import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NoteService } from '../../services/note.service';
import { Note, NoteFolder, DEFAULT_FOLDERS, FOLDER_COLORS, FOLDER_ICONS } from '../../models/note.model';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-note-folders',
  standalone: false,
  templateUrl: './note-folders.component.html',
  styleUrl: './note-folders.component.scss'
})
export class NoteFoldersComponent implements OnInit {
  public noteService = inject(NoteService);
  private router = inject(Router);
  private spinner = inject(NgxSpinnerService);
  
  isCreatingNote = signal(false);

  folders = signal<NoteFolder[]>([]);
  folderNoteCounts = signal<Map<string, number>>(new Map());
  notesByFolder = signal<Record<string, Note[]>>({});
  
  // Search
  searchQuery = signal('');

  // Filtered computed properties
  filteredFolders = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.folders();

    return this.folders().filter(folder => {
      // Matches folder name
      if (folder.name.toLowerCase().includes(query)) return true;
      
      // Matches any note inside the folder
      const folderNotes = this.notesByFolder()[folder.id] || [];
      return folderNotes.some(note => 
        (note.title || '').toLowerCase().includes(query) || 
        (note.content || '').toLowerCase().includes(query)
      );
    });
  });

  filteredNotesForFolder = (folderId: string): Note[] => {
    const query = this.searchQuery().toLowerCase();
    const notes = this.notesByFolder()[folderId] || [];
    if (!query) return notes;
    
    return notes.filter(note => 
      (note.title || '').toLowerCase().includes(query) || 
      (note.content || '').toLowerCase().includes(query)
    );
  };

  // Dialog for Create/Edit Folder
  showDialog = signal(false);
  editingFolder = signal<NoteFolder | null>(null);
  isNewFolder = signal(true);

  // Form fields for folder dialog
  folderName = signal('');
  folderIcon = signal(FOLDER_ICONS[0]);
  folderColor = signal(FOLDER_COLORS[0]);

  // Context Menu State
  showFolderMenuModal = signal(false);
  activeFolder = signal<NoteFolder | null>(null);

  showNoteMenuModal = signal(false);
  activeNote = signal<Note | null>(null);

  // Dialog for Rename Note
  showRenameNoteDialog = signal(false);
  renameNoteTitle = signal('');

  // Dialog for Move Note to Folder
  showMoveNoteDialog = signal(false);

  readonly FOLDER_COLORS = FOLDER_COLORS;
  readonly FOLDER_ICONS = FOLDER_ICONS;
  readonly DEFAULT_IDS = DEFAULT_FOLDERS.map(f => f.id);

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.noteService.getFolders().subscribe(folders => {
      const userFolders = folders.filter(f => !this.DEFAULT_IDS.includes(f.id));
      this.folders.set(userFolders);
      
      // Load note counts
      const counts = new Map<string, number>();
      userFolders.forEach(f => {
        this.noteService.getNoteCountByFolder(f.id).subscribe(c => {
          counts.set(f.id, c);
          this.folderNoteCounts.set(new Map(counts));
        });
      });
    });

    // Load and group notes by folder
    this.noteService.getAllNotes().subscribe(notes => {
      const grouped: Record<string, Note[]> = {};
      notes.forEach(note => {
        const fid = note.folderId || '';
        if (!grouped[fid]) {
          grouped[fid] = [];
        }
        grouped[fid].push(note);
      });
      this.notesByFolder.set(grouped);
    });
  }

  openFolder(folder: NoteFolder): void {
    const current = this.noteService.expandedFolders();
    this.noteService.expandedFolders.set({
      ...current,
      [folder.id]: !current[folder.id]
    });
  }

  // Chevron click: toggle expand/collapse state
  isExpanded(folderId: string): boolean {
    return !!this.noteService.expandedFolders()[folderId];
  }

  toggleFolderExpand(event: Event, folderId: string): void {
    event.stopPropagation();
    const current = this.noteService.expandedFolders();
    this.noteService.expandedFolders.set({
      ...current,
      [folderId]: !current[folderId]
    });
  }

  // Folder Actions
  openFolderMenu(event: Event, folder: NoteFolder): void {
    event.stopPropagation();
    event.preventDefault();
    this.activeFolder.set(folder);
    this.showFolderMenuModal.set(true);
  }

  closeFolderMenu(): void {
    this.showFolderMenuModal.set(false);
    this.activeFolder.set(null);
  }

  triggerCreateNoteInFolder(): void {
    const folder = this.activeFolder();
    this.closeFolderMenu();
    if (folder) {
      this.createNoteInFolder(folder.id);
    }
  }

  triggerCreateNoteInFolderDirect(event: Event, folderId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.createNoteInFolder(folderId);
  }

  private createNoteInFolder(folderId: string): void {
    if (this.isCreatingNote()) return;
    this.isCreatingNote.set(true);
    this.spinner.show();

    const newNote = {
      title: '',
      content: '',
      folderId: folderId,
      isPinned: false
    };

    this.noteService.addNote(newNote).subscribe({
      next: note => {
        this.isCreatingNote.set(false);
        this.spinner.hide();
        this.router.navigate(['/notes', 'edit', note.id], { queryParams: { edit: 'true' } });
      },
      error: () => {
        this.isCreatingNote.set(false);
        this.spinner.hide();
      }
    });
  }

  triggerRenameFolder(): void {
    const folder = this.activeFolder();
    this.closeFolderMenu();
    if (folder) {
      this.openEditDialog(folder);
    }
  }

  triggerDeleteFolder(): void {
    const folder = this.activeFolder();
    this.closeFolderMenu();
    if (folder) {
      this.deleteFolder(folder);
    }
  }

  // Note Actions
  openNoteMenu(event: Event, note: Note): void {
    event.stopPropagation();
    event.preventDefault();
    this.activeNote.set(note);
    this.showNoteMenuModal.set(true);
  }

  closeNoteMenu(): void {
    this.showNoteMenuModal.set(false);
    this.activeNote.set(null);
  }

  triggerRenameNote(): void {
    const note = this.activeNote();
    this.closeNoteMenu();
    if (note) {
      this.renameNoteTitle.set(note.title || '');
      this.showRenameNoteDialog.set(true);
    }
  }

  saveRenameNote(): void {
    const note = this.activeNote();
    const newTitle = this.renameNoteTitle().trim();
    if (!note || !newTitle) return;

    this.spinner.show();
    this.noteService.renameNote(note.id, newTitle).subscribe({
      next: () => {
        this.showRenameNoteDialog.set(false);
        this.activeNote.set(null);
        this.loadFolders();
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  triggerDuplicateNote(): void {
    const note = this.activeNote();
    this.closeNoteMenu();
    if (note) {
      this.spinner.show();
      this.noteService.duplicateNote(note.id).subscribe({
        next: () => {
          this.activeNote.set(null);
          this.loadFolders();
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

  triggerMoveNote(): void {
    const note = this.activeNote();
    this.closeNoteMenu();
    if (note) {
      this.showMoveNoteDialog.set(true);
    }
  }

  moveNoteToFolder(folderId: string): void {
    const note = this.activeNote();
    if (!note) return;

    this.spinner.show();
    this.noteService.updateNote(note.id, { folderId }).subscribe({
      next: () => {
        this.showMoveNoteDialog.set(false);
        this.activeNote.set(null);
        this.loadFolders();
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  triggerDeleteNote(): void {
    const note = this.activeNote();
    this.closeNoteMenu();
    if (note) {
      this.spinner.show();
      this.noteService.deleteNote(note.id).subscribe({
        next: () => {
          this.activeNote.set(null);
          this.loadFolders();
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

  openNote(note: Note): void {
    this.router.navigate(['/notes', 'edit', note.id]);
  }

  // Folder Dialog handlers
  openCreateDialog(): void {
    this.isNewFolder.set(true);
    this.editingFolder.set(null);
    this.folderName.set('');
    this.folderIcon.set(FOLDER_ICONS[0]);
    this.folderColor.set(FOLDER_COLORS[0]);
    this.showDialog.set(true);
  }

  openEditDialog(folder: NoteFolder): void {
    if (this.DEFAULT_IDS.includes(folder.id)) return; // can't edit defaults
    this.isNewFolder.set(false);
    this.editingFolder.set(folder);
    this.folderName.set(folder.name);
    this.folderIcon.set(folder.icon);
    this.folderColor.set(folder.color);
    this.showDialog.set(true);
  }

  saveFolder(): void {
    const name = this.folderName().trim();
    if (!name) return;

    this.spinner.show();
    if (this.isNewFolder()) {
      this.noteService.addFolder({
        name,
        icon: this.folderIcon(),
        color: this.folderColor(),
        order: this.folders().length
      }).subscribe({
        next: () => {
          this.showDialog.set(false);
          this.loadFolders();
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    } else {
      const folder = this.editingFolder()!;
      this.noteService.updateFolder({
        ...folder,
        name,
        icon: this.folderIcon(),
        color: this.folderColor()
      }).subscribe({
        next: () => {
          this.showDialog.set(false);
          this.loadFolders();
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }

  deleteFolder(folder: NoteFolder): void {
    if (this.DEFAULT_IDS.includes(folder.id)) return;
    this.spinner.show();
    this.noteService.deleteFolder(folder.id).subscribe({
      next: () => {
        this.loadFolders();
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  getNoteCount(folderId: string): number {
    return this.folderNoteCounts().get(folderId) ?? 0;
  }

  isDefault(folderId: string): boolean {
    return this.DEFAULT_IDS.includes(folderId);
  }

  getNotesForFolder(folderId: string): Note[] {
    return this.notesByFolder()[folderId] ?? [];
  }
}
