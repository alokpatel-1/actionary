import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';

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
  public sidebarService = inject(SidebarService);
  note = signal<ReaderNote | null>(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.note.set({
        id,
        title: 'System Architecture Overview',
        content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps.',
        tags: ['architecture', 'mean'],
        createdAt: Date.now() - 86400000
      });
    }
  }
}
