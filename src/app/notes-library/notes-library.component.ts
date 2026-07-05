import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteService } from '../study-notes/services/note.service';
import { NoteIdbService } from '../study-notes/services/note-idb.service';
import { Note, NoteFolder } from '../study-notes/models/note.model';

@Component({
  selector: 'app-notes-library',
  templateUrl: './notes-library.component.html',
  styleUrls: ['./notes-library.component.scss'],
  standalone: false
})
export class NotesLibraryComponent implements OnInit {
  private noteService = inject(NoteService);
  private idbService = inject(NoteIdbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  folders = signal<NoteFolder[]>([]);
  notes = signal<Note[]>([]);
  searchQuery = signal('');

  // Grouped notes
  groupedNotes = computed(() => {
    const allNotes = this.notes();
    const query = this.searchQuery().toLowerCase();
    
    // Filter notes
    const filteredNotes = allNotes.filter(note => {
      if (!query) return true;
      const titleMatch = (note.title || '').toLowerCase().includes(query);
      const contentMatch = (note.content || '').toLowerCase().includes(query);
      // We will add folder match in the grouping phase or here
      return titleMatch || contentMatch;
    });

    const groups: { folder: NoteFolder | null, notes: Note[] }[] = [];
    const foldersMap = new Map(this.folders().map(f => [f.id, f]));

    // Grouping
    const folderGroups = new Map<string, Note[]>();
    filteredNotes.forEach(note => {
      const folderId = note.folderId || '__no_folder__';
      if (!folderGroups.has(folderId)) {
        folderGroups.set(folderId, []);
      }
      folderGroups.get(folderId)!.push(note);
    });

    // Convert to array format
    folderGroups.forEach((folderNotes, folderId) => {
      // Sort notes by updated date (newest first)
      folderNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      
      if (folderId === '__no_folder__' || !foldersMap.has(folderId)) {
        groups.push({ folder: null, notes: folderNotes });
      } else {
        groups.push({ folder: foldersMap.get(folderId)!, notes: folderNotes });
      }
    });

    // Sort groups: Folders first (alphabetically), then No Folder
    groups.sort((a, b) => {
      if (a.folder && b.folder) return a.folder.name.localeCompare(b.folder.name);
      if (a.folder) return -1;
      if (b.folder) return 1;
      return 0;
    });

    // Filter by folder name if search query exists and didn't match note title/content
    if (query) {
      return groups.filter(g => {
        const folderMatch = g.folder && g.folder.name.toLowerCase().includes(query);
        return folderMatch || g.notes.length > 0;
      });
    }

    return groups;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
    });

    this.noteService.getFolders().subscribe(f => {
      this.folders.set(f);
    });
    
    // We should get all notes. Wait, `NoteService` has `getNotes()` ? Let's check NoteService.
    this.idbService.getAllNotes().then(notes => {
      this.notes.set(notes.filter(n => !n.isDeleted));
    });
  }

  getPreview(html: string): string {
    if (!html) return 'No content';
    // Simple HTML strip
    const text = html.replace(/<[^>]*>?/gm, ' ');
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  getReadingTime(html: string): number {
    const text = html.replace(/<[^>]*>?/gm, ' ');
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200)); // 200 words per min
  }

  openNote(id: string): void {
    this.router.navigate(['/library/read', id]);
  }
}
