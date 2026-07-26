import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, AdminNote } from '../services/admin.service';
import { ReaderNote, NoteComment } from '../../shared/models/note.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-content-view',
  standalone: false,
  templateUrl: './admin-content-view.component.html',
  styleUrl: './admin-content-view.component.scss'
})
export class AdminContentViewComponent implements OnInit {
  note = signal<ReaderNote | null>(null);
  adminNote = signal<AdminNote | null>(null);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  // Confirm Dialog State
  isConfirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmActionText = '';
  pendingAction: 'MODERATE' | 'RESTORE' | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Fetch basic admin metadata
      this.adminService.getNotes(1, 100).subscribe(res => {
        const found = res.data.find((n: any) => n._id === id);
        if (found) {
          this.adminNote.set(found);
        }
      });

      // Mock fetching the rich reader note details
      this.note.set({
        id,
        title: 'Understanding Redis Architecture', // Mock fallback title
        content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps. <br><br> Redis is highly efficient in caching... (Note: this is exactly what the reader sees)',
        tags: ['architecture', 'redis', 'caching'],
        createdAt: Date.now() - 86400000,
        publisherId: 'pub_1',
        publisherName: 'John Doe',
        publisherAvatar: 'https://i.pravatar.cc/150?u=john',
        likes: 142,
        dislikes: 3,
        comments: [
          {
            id: 'c1',
            userId: 'u1',
            userName: 'Tech Fan',
            userAvatar: 'https://i.pravatar.cc/150?u=u1',
            content: 'This architecture makes so much sense. I especially liked the decoupling of data models.',
            createdAt: Date.now() - 3600000,
            likes: 12,
            dislikes: 0,
            replies: [],
            currentUserAction: null
          }
        ]
      });
    }
  }

  goBack() {
    this.router.navigate(['/admin/content']);
  }

  openModerateConfirm() {
    this.confirmTitle = 'Moderate Content';
    this.confirmMessage = 'Are you sure you want to flag this content? It will be hidden from the public feed.';
    this.confirmActionText = 'Moderate';
    this.pendingAction = 'MODERATE';
    this.isConfirmOpen = true;
  }

  openRestoreConfirm() {
    this.confirmTitle = 'Restore Content';
    this.confirmMessage = 'Are you sure you want to restore this content? It will be publicly visible again.';
    this.confirmActionText = 'Restore';
    this.pendingAction = 'RESTORE';
    this.isConfirmOpen = true;
  }

  executeConfirm() {
    if (this.pendingAction === 'MODERATE') {
      this.moderateNote();
    } else if (this.pendingAction === 'RESTORE') {
      this.restoreNote();
    }
    this.closeConfirm();
  }

  closeConfirm() {
    this.isConfirmOpen = false;
    this.pendingAction = null;
  }

  private moderateNote() {
    const current = this.adminNote();
    if (!current) return;
    this.adminService.moderateNote(current._id, 'MODERATED').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Moderated', detail: 'Note has been moderated.' });
        current.status = 'MODERATED';
        this.adminNote.set({ ...current });
      }
    });
  }

  private restoreNote() {
    const current = this.adminNote();
    if (!current) return;
    this.adminService.moderateNote(current._id, 'PUBLISHED').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Restored', detail: 'Note has been restored to public.' });
        current.status = 'PUBLISHED';
        this.adminNote.set({ ...current });
      }
    });
  }
}
