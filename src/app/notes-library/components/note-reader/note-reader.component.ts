import { Component, OnInit, inject, signal } from '@angular/core';
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
export class NoteReaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private idbService = inject(NoteIdbService);
  private sanitizer = inject(DomSanitizer);

  note = signal<Note | null>(null);
  folder = signal<NoteFolder | null>(null);
  safeContent = signal<SafeHtml>('');
  readingTime = signal(1);

  ngOnInit(): void {
    const noteId = this.route.snapshot.paramMap.get('id');
    if (noteId) {
      this.idbService.getNote(noteId).then(note => {
        if (note) {
          this.note.set(note);
          this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(note.content || ''));
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
}
