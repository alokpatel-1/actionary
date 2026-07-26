import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';
import { ReaderNote } from '../../shared/models/note.model';

export interface PublisherProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  joinedDate: number;
  followersCount: number;
  isFollowing: boolean;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

@Component({
  selector: 'app-publisher-profile',
  standalone: false,
  templateUrl: './publisher-profile.component.html',
  styleUrl: './publisher-profile.component.scss'
})
export class PublisherProfileComponent implements OnInit {
  public sidebarService = inject(SidebarService);
  
  publisher = signal<PublisherProfile | null>(null);
  publisherNotes = signal<ReaderNote[]>([]);

  showUnfollowConfirmModal = signal(false);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Mock publisher data
      this.publisher.set({
        id,
        name: 'Alice Publisher',
        avatar: 'https://i.pravatar.cc/150?u=' + id,
        bio: 'Tech enthusiast and software engineer writing about web development, systems architecture, and UI/UX design patterns.',
        joinedDate: Date.now() - 31536000000, // approx 1 year ago
        followersCount: 1450,
        isFollowing: false,
        socialLinks: {
          twitter: 'https://twitter.com/alice',
          github: 'https://github.com/alice',
          linkedin: 'https://linkedin.com/in/alice',
          website: 'https://alice.dev'
        }
      });


      // Mock publisher notes
      this.publisherNotes.set([
        { id: '1', title: 'System Architecture Overview', content: 'In-depth breakdown of MEAN stack modular architecture, clean layering, state signals, and decoupled data models for enterprise web apps.', tags: ['architecture', 'mean'], createdAt: Date.now() - 86400000, publisherId: id, publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=' + id },
        { id: '2', title: 'TypeScript 5.4 Advanced Features', content: 'Comprehensive guide exploring narrowing in closure functions, NoInfer utility type, Object.groupBy helper, and reactive signal workflows.', tags: ['typescript', 'frontend'], createdAt: Date.now() - 172800000, publisherId: id, publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=' + id },
        { id: '3', title: 'Building Reactive State with Angular Signals', content: 'Learn how computed signals, effects, and writable signals eliminate zone.js overhead and streamline Angular state management.', tags: ['angular', 'frontend'], createdAt: Date.now() - 259200000, publisherId: id, publisherName: 'Alice Publisher', publisherAvatar: 'https://i.pravatar.cc/150?u=' + id }
      ]);
    }
  }

  openNote(id: string): void {
    this.router.navigate(['/reader/notes', id]);
  }

  toggleFollow(): void {
    const p = this.publisher();
    if (!p) return;

    if (p.isFollowing) {
      this.showUnfollowConfirmModal.set(true);
    } else {
      this.publisher.update(curr => curr ? {
        ...curr,
        isFollowing: true,
        followersCount: curr.followersCount + 1
      } : null);
    }
  }

  confirmUnfollow(): void {
    this.publisher.update(curr => curr ? {
      ...curr,
      isFollowing: false,
      followersCount: curr.followersCount - 1
    } : null);
    this.showUnfollowConfirmModal.set(false);
  }

  cancelUnfollow(): void {
    this.showUnfollowConfirmModal.set(false);
  }
}
