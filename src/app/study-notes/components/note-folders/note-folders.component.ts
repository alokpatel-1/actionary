import { Component, OnInit, inject, signal } from '@angular/core';
import { NoteService } from '../../services/note.service';
import { NoteFolder, DEFAULT_FOLDERS, FOLDER_COLORS, FOLDER_ICONS } from '../../models/note.model';

@Component({
  selector: 'app-note-folders',
  standalone: false,
  templateUrl: './note-folders.component.html',
  styleUrl: './note-folders.component.scss'
})
export class NoteFoldersComponent implements OnInit {
  private noteService = inject(NoteService);

  folders = signal<NoteFolder[]>([]);
  folderNoteCounts = signal<Map<string, number>>(new Map());
  showDialog = signal(false);
  editingFolder = signal<NoteFolder | null>(null);
  isNewFolder = signal(true);

  // Form fields
  folderName = signal('');
  folderIcon = signal(FOLDER_ICONS[0]);
  folderColor = signal(FOLDER_COLORS[0]);

  readonly FOLDER_COLORS = FOLDER_COLORS;
  readonly FOLDER_ICONS = FOLDER_ICONS;
  readonly DEFAULT_IDS = DEFAULT_FOLDERS.map(f => f.id);

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.noteService.getFolders().subscribe(folders => {
      this.folders.set(folders);
      // Load note counts
      const counts = new Map<string, number>();
      folders.forEach(f => {
        this.noteService.getNoteCountByFolder(f.id).subscribe(c => {
          counts.set(f.id, c);
          this.folderNoteCounts.set(new Map(counts));
        });
      });
    });
  }

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

    if (this.isNewFolder()) {
      this.noteService.addFolder({
        name,
        icon: this.folderIcon(),
        color: this.folderColor(),
        order: this.folders().length
      }).subscribe(() => {
        this.showDialog.set(false);
        this.loadFolders();
      });
    } else {
      const folder = this.editingFolder()!;
      this.noteService.updateFolder({
        ...folder,
        name,
        icon: this.folderIcon(),
        color: this.folderColor()
      }).subscribe(() => {
        this.showDialog.set(false);
        this.loadFolders();
      });
    }
  }

  deleteFolder(folder: NoteFolder): void {
    if (this.DEFAULT_IDS.includes(folder.id)) return;
    this.noteService.deleteFolder(folder.id).subscribe(() => {
      this.loadFolders();
    });
  }

  getNoteCount(folderId: string): number {
    return this.folderNoteCounts().get(folderId) ?? 0;
  }

  isDefault(folderId: string): boolean {
    return this.DEFAULT_IDS.includes(folderId);
  }
}
