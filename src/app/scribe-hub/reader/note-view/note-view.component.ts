import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export interface ReaderNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

@Component({
  selector: 'app-reader-note-view',
  standalone: false,
  templateUrl: './note-view.component.html',
  styleUrl: './note-view.component.scss'
})
export class NoteViewComponent implements OnInit {
  note = signal<ReaderNote | null>(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.note.set({
        id,
        title: 'System Architecture Overview',
        content: 'Notes on MEAN stack modular architecture and data structures...',
        tags: ['architecture', 'mean'],
        createdAt: Date.now() - 86400000
      });
    }
  }
}
