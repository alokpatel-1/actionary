import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';

import { ReaderNote, NoteComment } from '../../shared/models/note.model';

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
        createdAt: Date.now() - 86400000,
        publisherId: 'pub_1',
        publisherName: 'Alice Publisher',
        publisherAvatar: 'https://i.pravatar.cc/150?u=alice',
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
            replies: [
              {
                id: 'c1_r1',
                userId: 'u2',
                userName: 'Alice Publisher',
                userAvatar: 'https://i.pravatar.cc/150?u=alice',
                content: 'Thank you! Decoupling really pays off in the long run for enterprise scale.',
                createdAt: Date.now() - 1800000,
                likes: 5,
                dislikes: 0,
                replies: []
              }
            ]
          }
        ]
      });
    }
  }

  // --- Note Engagement ---
  likeNote() {
    this.note.update(n => {
      if (!n) return null;
      let likes = n.likes || 0;
      let dislikes = n.dislikes || 0;
      let action = n.currentUserAction;

      if (action === 'liked') {
        likes--;
        action = null;
      } else if (action === 'disliked') {
        dislikes--;
        likes++;
        action = 'liked';
      } else {
        likes++;
        action = 'liked';
      }
      return { ...n, likes, dislikes, currentUserAction: action };
    });
  }

  dislikeNote() {
    this.note.update(n => {
      if (!n) return null;
      let likes = n.likes || 0;
      let dislikes = n.dislikes || 0;
      let action = n.currentUserAction;

      if (action === 'disliked') {
        dislikes--;
        action = null;
      } else if (action === 'liked') {
        likes--;
        dislikes++;
        action = 'disliked';
      } else {
        dislikes++;
        action = 'disliked';
      }
      return { ...n, likes, dislikes, currentUserAction: action };
    });
  }

  // --- Comments State ---
  newCommentText = signal('');
  replyingToCommentId = signal<string | null>(null);
  replyText = signal('');

  addComment() {
    const text = this.newCommentText().trim();
    if (!text) return;
    const newComment: NoteComment = {
      id: 'c_' + Date.now(),
      userId: 'me',
      userName: 'Current User',
      userAvatar: 'https://i.pravatar.cc/150?u=me',
      content: text,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0,
      replies: [],
      currentUserAction: null
    };
    this.note.update(n => {
      if (!n) return null;
      return { ...n, comments: [newComment, ...(n.comments || [])] };
    });
    this.newCommentText.set('');
  }

  setReplyTo(commentId: string) {
    this.replyingToCommentId.set(commentId);
    this.replyText.set('');
  }

  cancelReply() {
    this.replyingToCommentId.set(null);
    this.replyText.set('');
  }

  addReply(parentId: string) {
    const text = this.replyText().trim();
    if (!text) return;
    const newReply: NoteComment = {
      id: 'r_' + Date.now(),
      userId: 'me',
      userName: 'Current User',
      userAvatar: 'https://i.pravatar.cc/150?u=me',
      content: text,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0,
      replies: [],
      currentUserAction: null
    };
    
    this.note.update(n => {
      if (!n) return null;
      const addNestedReply = (comments: NoteComment[]): NoteComment[] => {
        return comments.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newReply] };
          }
          if (c.replies && c.replies.length) {
            return { ...c, replies: addNestedReply(c.replies) };
          }
          return c;
        });
      };
      return { ...n, comments: addNestedReply(n.comments || []) };
    });
    this.cancelReply();
  }

  likeComment(commentId: string) {
    this.updateCommentStat(commentId, 'liked');
  }

  dislikeComment(commentId: string) {
    this.updateCommentStat(commentId, 'disliked');
  }

  private updateCommentStat(id: string, newAction: 'liked' | 'disliked') {
    this.note.update(n => {
      if (!n) return null;
      const updateStat = (comments: NoteComment[]): NoteComment[] => {
        return comments.map(c => {
          if (c.id === id) {
            let likes = c.likes;
            let dislikes = c.dislikes;
            let action = c.currentUserAction;

            if (newAction === 'liked') {
              if (action === 'liked') {
                likes--;
                action = null;
              } else if (action === 'disliked') {
                dislikes--;
                likes++;
                action = 'liked';
              } else {
                likes++;
                action = 'liked';
              }
            } else if (newAction === 'disliked') {
              if (action === 'disliked') {
                dislikes--;
                action = null;
              } else if (action === 'liked') {
                likes--;
                dislikes++;
                action = 'disliked';
              } else {
                dislikes++;
                action = 'disliked';
              }
            }
            return { ...c, likes, dislikes, currentUserAction: action };
          }
          if (c.replies && c.replies.length) {
            return { ...c, replies: updateStat(c.replies) };
          }
          return c;
        });
      };
      return { ...n, comments: updateStat(n.comments || []) };
    });
  }
}
