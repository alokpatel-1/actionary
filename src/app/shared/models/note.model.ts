export interface NoteComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  replies?: NoteComment[]; // Nested replies
  currentUserAction?: 'liked' | 'disliked' | null;
}

export interface ReaderNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  publisherId?: string;
  publisherName?: string;
  publisherAvatar?: string;
  likes?: number;
  dislikes?: number;
  comments?: NoteComment[];
  currentUserAction?: 'liked' | 'disliked' | null;
}
